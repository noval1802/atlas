import { NextResponse } from "next/server";
import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { apiError, authorizationError } from "@/http/api-response";
import { prisma } from "@/lib/prisma";
import { reportSchema, reportWorkflowSchema } from "@/operations/schema";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation, readJsonBody } from "@/security/request-security";

type Context = { params: Promise<{ id: string }> };

async function contextFor(params: Context["params"], permission: "report:update" | "report:delete") {
  const principal = await getAuthPrincipal();
  const basic = authorize(principal, permission);
  if (!basic.ok) return { error: authorizationError(basic) } as const;
  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id }, include: { kodam: true } });
  if (!report) return { error: apiError("Laporan tidak ditemukan", 404) } as const;
  const scoped = authorize(principal, permission, report.kodam?.code);
  if (!scoped.ok) return { error: authorizationError(scoped) } as const;
  return { principal: principal!, report, id } as const;
}

export async function PUT(request: Request, { params }: Context) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const checked = await contextFor(params, "report:update");
  if ("error" in checked) return checked.error;
  if (checked.report.status !== "DRAFT") return apiError("Hanya laporan draft yang dapat diedit", 409);
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = reportSchema.safeParse(body.value);
  if (!parsed.success) return apiError("Data laporan tidak valid", 400, parsed.error.flatten());
  const kodam = parsed.data.kodamCode
    ? await prisma.kodam.findUnique({ where: { code: parsed.data.kodamCode } })
    : null;
  if (parsed.data.kodamCode && !kodam) return apiError("Kodam tidak ditemukan", 400);
  if (kodam) {
    const scoped = authorize(checked.principal, "report:update", kodam.code);
    if (!scoped.ok) return authorizationError(scoped);
  }
  const report = await prisma.report.update({
    where: { id: checked.id },
    data: {
      type: parsed.data.type,
      title: parsed.data.title,
      reportDate: parsed.data.reportDate,
      content: { summary: parsed.data.summary },
      kodamId: kodam?.id ?? null,
    },
    include: { kodam: true },
  });
  await writeAuditLog({
    request,
    principal: checked.principal,
    action: "UPDATE_REPORT",
    entity: "Report",
    entityId: report.id,
    oldValue: auditJson(checked.report),
    newValue: auditJson(report),
  });
  return NextResponse.json(report);
}

export async function PATCH(request: Request, { params }: Context) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const checked = await contextFor(params, "report:update");
  if ("error" in checked) return checked.error;
  if (!["SUPER_ADMIN", "ADMIN", "OPERATOR_PUSDALOPS"].includes(checked.principal.role))
    return apiError("Approval laporan memerlukan kewenangan Pusdalops", 403);
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = reportWorkflowSchema.safeParse(body.value);
  if (!parsed.success) return apiError("Aksi workflow tidak valid", 400, parsed.error.flatten());
  const status =
    parsed.data.action === "PUBLISH" ? "PUBLISHED" : parsed.data.action === "ARCHIVE" ? "ARCHIVED" : "DRAFT";
  const report = await prisma.report.update({
    where: { id: checked.id },
    data: {
      status,
      approvedBy: status === "PUBLISHED" ? (checked.principal.id ?? checked.principal.email) : null,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
    include: { kodam: true },
  });
  await writeAuditLog({
    request,
    principal: checked.principal,
    action: `REPORT_${parsed.data.action}`,
    entity: "Report",
    entityId: report.id,
    oldValue: auditJson(checked.report),
    newValue: auditJson(report),
  });
  return NextResponse.json(report);
}

export async function DELETE(request: Request, { params }: Context) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const checked = await contextFor(params, "report:delete");
  if ("error" in checked) return checked.error;
  if (checked.report.status !== "DRAFT") return apiError("Hanya laporan draft yang dapat dihapus", 409);
  await prisma.report.delete({ where: { id: checked.id } });
  await writeAuditLog({
    request,
    principal: checked.principal,
    action: "DELETE_REPORT",
    entity: "Report",
    entityId: checked.id,
    oldValue: auditJson(checked.report),
  });
  return NextResponse.json({ ok: true });
}
