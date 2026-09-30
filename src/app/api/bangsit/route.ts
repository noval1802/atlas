import { NextResponse } from "next/server";
import { authorize, scopedKodamCodes } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { generateBangsitPdf } from "@/bangsit/pdf";
import { bangsitArchiveSchema } from "@/bangsit/schema";
import { DocumentStorageConfigurationError, DocumentStorageError } from "@/documents/document-storage";
import { getDocumentStorage } from "@/documents/local-storage";
import { bangsitDocumentFolder, safeDocumentSegment } from "@/documents/path";
import { prisma } from "@/lib/prisma";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation, readJsonBody } from "@/security/request-security";
import { publishRealtimeEvent } from "@/lib/realtime-publisher";

function denied(error: string, status: 401 | 403) {
  return NextResponse.json({ error }, { status });
}

export async function GET() {
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "bangsit:read");
  if (!access.ok) return denied(access.error, access.status);
  if (!principal) return denied("Autentikasi diperlukan", 401);
  const scope = scopedKodamCodes(principal);
  return NextResponse.json(
    await prisma.bangsitArchive.findMany({
      where: scope ? { kodam: { code: { in: scope } } } : undefined,
      include: { kodam: { select: { code: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  );
}

export async function POST(request: Request) {
  const blocked = protectMutation(request, 20);
  if (blocked) return blocked;
  const principal = await getAuthPrincipal();
  const base = authorize(principal, "bangsit:create");
  if (!base.ok) return denied(base.error, base.status);
  if (!principal) return denied("Autentikasi diperlukan", 401);
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = bangsitArchiveSchema.safeParse(body.value);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Validasi BANGSIT gagal", issues: parsed.error.flatten() },
      { status: 400 },
    );

  const kodam = await prisma.kodam.findFirst({
    where: { OR: [{ name: parsed.data.kodam }, { code: parsed.data.kodam }] },
    select: { id: true, code: true, name: true },
  });
  if (!kodam) return NextResponse.json({ error: "Kodam tidak ditemukan" }, { status: 400 });
  const scoped = authorize(principal, "bangsit:create", kodam.code);
  if (!scoped.ok) return denied(scoped.error, scoped.status);

  const date = new Date(`${parsed.data.date}T00:00:00.000Z`);
  const reportId = safeDocumentSegment(
    `BANGSIT-${parsed.data.date.replaceAll("-", "")}-${parsed.data.time.replace(":", "")}-${kodam.code.replaceAll("/", "-")}`,
  );
  const filename = `${reportId}.pdf`;
  const path = `${bangsitDocumentFolder(kodam.code, date)}/${filename}`;

  try {
    const pdf = generateBangsitPdf(reportId, parsed.data);
    const stored = await getDocumentStorage().uploadFile(path, pdf, "application/pdf");
    const archive = await prisma.bangsitArchive.upsert({
      where: { reportId },
      update: {
        title: `${parsed.data.eventType} - ${parsed.data.location}`,
        filename,
        path,
        nextcloudFileId: stored.fileId,
        payload: parsed.data,
        createdBy: principal.id ?? principal.email ?? "unknown",
      },
      create: {
        reportId,
        kodamId: kodam.id,
        title: `${parsed.data.eventType} - ${parsed.data.location}`,
        filename,
        mimeType: "application/pdf",
        path,
        nextcloudFileId: stored.fileId,
        payload: parsed.data,
        createdBy: principal.id ?? principal.email ?? "unknown",
      },
    });
    await writeAuditLog({
      request,
      principal,
      action: "GENERATE_BANGSIT",
      entity: "BangsitArchive",
      entityId: archive.id,
      newValue: auditJson(archive),
      metadata: { reportId, kodamCode: kodam.code, format: "PDF", role: principal.role },
    });
    await publishRealtimeEvent({ resource: "bangsit", action: "create", id: archive.id });
    return NextResponse.json(
      { id: archive.id, reportId, title: archive.title, filename, createdAt: archive.createdAt },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof DocumentStorageConfigurationError)
      return NextResponse.json({ error: error.message }, { status: 503 });
    if (error instanceof DocumentStorageError)
      return NextResponse.json({ error: "Arsip dokumen tidak tersedia" }, { status: error.status });
    return NextResponse.json({ error: "BANGSIT gagal dibuat" }, { status: 500 });
  }
}
