import { NextResponse } from "next/server";
import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { apiError, authorizationError } from "@/http/api-response";
import { isMonitoringModule, monitoringPermissions } from "@/monitoring/config";
import { hasRequiredUnrasMetrics, operationalRecordSchema } from "@/monitoring/schema";
import { prisma } from "@/lib/prisma";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation, readJsonBody } from "@/security/request-security";
import { publishRealtimeEvent } from "@/lib/realtime-publisher";

type Context = { params: Promise<{ module: string }> };

export async function GET(_: Request, { params }: Context) {
  const { module } = await params;
  if (!isMonitoringModule(module)) return apiError("Modul monitoring tidak ditemukan", 404);
  const principal = await getAuthPrincipal();
  const access = authorize(principal, monitoringPermissions[module].read);
  if (!access.ok) return authorizationError(access);
  return NextResponse.json(
    await prisma.operationalRecord.findMany({
      where: { module },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  );
}

export async function POST(request: Request, { params }: Context) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const { module } = await params;
  if (!isMonitoringModule(module)) return apiError("Modul monitoring tidak ditemukan", 404);
  const principal = await getAuthPrincipal();
  const access = authorize(principal, monitoringPermissions[module].write);
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = operationalRecordSchema.safeParse(body.value);
  if (!parsed.success) return apiError("Validasi data monitoring gagal", 400, parsed.error.flatten());
  if (module === "unras" && !hasRequiredUnrasMetrics(parsed.data)) {
    return apiError("Estimasi massa dan personel pengamanan wajib diisi untuk Unras", 400);
  }
  const record = await prisma.operationalRecord.create({
    data: {
      ...parsed.data,
      module,
      sortOrder: parsed.data.sortOrder ?? 0,
      createdBy: principal.id ?? principal.email ?? "unknown",
    },
  });
  await writeAuditLog({
    request,
    principal,
    action: "CREATE_MONITORING",
    entity: "OperationalRecord",
    entityId: record.id,
    newValue: auditJson(record),
    metadata: { module, role: principal.role },
  });
  await publishRealtimeEvent({
    resource: "monitoring",
    action: "create",
    id: record.id,
    module,
  });
  return NextResponse.json(record, { status: 201 });
}
