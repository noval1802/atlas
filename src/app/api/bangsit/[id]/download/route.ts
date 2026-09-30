import { NextResponse } from "next/server";
import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { DocumentStorageConfigurationError, DocumentStorageError } from "@/documents/document-storage";
import { getDocumentStorage } from "@/documents/local-storage";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/security/audit";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const { id } = await params;
  const principal = await getAuthPrincipal();
  const base = authorize(principal, "bangsit:export");
  if (!base.ok) return NextResponse.json({ error: base.error }, { status: base.status });
  if (!principal) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  const archive = await prisma.bangsitArchive.findUnique({
    where: { id },
    include: { kodam: { select: { code: true } } },
  });
  if (!archive) return NextResponse.json({ error: "Arsip BANGSIT tidak ditemukan" }, { status: 404 });
  const scoped = authorize(principal, "bangsit:export", archive.kodam.code);
  if (!scoped.ok) return NextResponse.json({ error: scoped.error }, { status: scoped.status });
  try {
    const upstream = await getDocumentStorage().getFile(archive.path);
    await writeAuditLog({
      request,
      principal,
      action: "DOWNLOAD_BANGSIT",
      entity: "BangsitArchive",
      entityId: archive.id,
      metadata: { reportId: archive.reportId, role: principal.role },
    });
    return new Response(upstream.body, {
      headers: {
        "Content-Type": archive.mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(archive.filename)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof DocumentStorageConfigurationError)
      return NextResponse.json({ error: error.message }, { status: 503 });
    if (error instanceof DocumentStorageError)
      return NextResponse.json({ error: "Arsip dokumen tidak tersedia" }, { status: error.status });
    return NextResponse.json({ error: "BANGSIT gagal diunduh" }, { status: 500 });
  }
}
