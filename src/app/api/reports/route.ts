import { NextResponse } from "next/server";
import { authorize, scopedKodamCodes } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { apiError, authorizationError } from "@/http/api-response";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/operations/schema";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation, readJsonBody } from "@/security/request-security";

export async function GET() {
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "report:read");
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const scope = scopedKodamCodes(principal);
  return NextResponse.json(
    await prisma.report.findMany({
      where: scope ? { kodam: { code: { in: scope } } } : undefined,
      include: { kodam: true },
      orderBy: { reportDate: "desc" },
      take: 500,
    }),
  );
}

export async function POST(request: Request) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "report:create");
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = reportSchema.safeParse(body.value);
  if (!parsed.success) return apiError("Data laporan tidak valid", 400, parsed.error.flatten());
  const kodam = parsed.data.kodamCode
    ? await prisma.kodam.findUnique({ where: { code: parsed.data.kodamCode } })
    : null;
  if (parsed.data.kodamCode && !kodam) return apiError("Kodam tidak ditemukan", 400);
  if (kodam) {
    const scoped = authorize(principal, "report:create", kodam.code);
    if (!scoped.ok) return authorizationError(scoped);
  }
  const report = await prisma.report.create({
    data: {
      type: parsed.data.type,
      title: parsed.data.title,
      reportDate: parsed.data.reportDate,
      content: { summary: parsed.data.summary },
      kodamId: kodam?.id,
      createdBy: principal.id ?? principal.email ?? "unknown",
    },
    include: { kodam: true },
  });
  await writeAuditLog({
    request,
    principal,
    action: "CREATE_REPORT",
    entity: "Report",
    entityId: report.id,
    newValue: auditJson(report),
  });
  return NextResponse.json(report, { status: 201 });
}
