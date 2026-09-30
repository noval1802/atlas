import { NextResponse } from "next/server";
import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { apiError, authorizationError } from "@/http/api-response";
import { isMonitoringModule, monitoringPermissions } from "@/monitoring/config";
import { hasRequiredUnrasMetrics, operationalResetSchema } from "@/monitoring/schema";
import { prisma } from "@/lib/prisma";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation, readJsonBody } from "@/security/request-security";
import { publishRealtimeEvent } from "@/lib/realtime-publisher";

type Context = { params: Promise<{ module: string }> };

export async function POST(request: Request, { params }: Context) {
  const blocked = protectMutation(request, 10);
  if (blocked) return blocked;
  const { module } = await params;
  if (!isMonitoringModule(module)) return apiError("Modul monitoring tidak ditemukan", 404);
  const principal = await getAuthPrincipal();
  const access = authorize(principal, monitoringPermissions[module].write);
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = operationalResetSchema.safeParse(body.value);
  if (!parsed.success) return apiError("Data awal monitoring tidak valid", 400, parsed.error.flatten());
  if (module === "unras" && parsed.data.rows.some((row) => !hasRequiredUnrasMetrics(row))) {
    return apiError("Estimasi massa dan personel pengamanan wajib diisi untuk Unras", 400);
  }
  const oldRows = await prisma.operationalRecord.findMany({ where: { module } });
  const rows = await prisma.$transaction(async (transaction) => {
    await transaction.operationalRecord.deleteMany({ where: { module } });
    await transaction.operationalRecord.createMany({
      data: parsed.data.rows.map((row, sortOrder) => ({
        ...row,
        module,
        sortOrder,
        createdBy: principal.id ?? principal.email ?? "unknown",
      })),
    });
    return transaction.operationalRecord.findMany({ where: { module }, orderBy: { sortOrder: "asc" } });
  });
  await writeAuditLog({
    request,
    principal,
    action: "RESET_MONITORING",
    entity: "OperationalRecord",
    newValue: auditJson(rows),
    oldValue: auditJson(oldRows),
    metadata: { module, role: principal.role },
  });
  await publishRealtimeEvent({ resource: "monitoring", action: "reset", module });
  return NextResponse.json(rows);
}
