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

type Context = { params: Promise<{ module: string; id: string }> };

async function context(params: Context["params"]) {
  const { module, id } = await params;
  if (!isMonitoringModule(module))
    return { error: apiError("Modul monitoring tidak ditemukan", 404) } as const;
  const principal = await getAuthPrincipal();
  const access = authorize(principal, monitoringPermissions[module].write);
  if (!access.ok) return { error: authorizationError(access) } as const;
  if (!principal) return { error: apiError("Autentikasi diperlukan", 401) } as const;
  const record = await prisma.operationalRecord.findFirst({ where: { id, module } });
  if (!record) return { error: apiError("Data monitoring tidak ditemukan", 404) } as const;
  return { module, id, principal, record } as const;
}

export async function PUT(request: Request, { params }: Context) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const checked = await context(params);
  if ("error" in checked) return checked.error;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = operationalRecordSchema.partial().safeParse(body.value);
  if (!parsed.success) return apiError("Validasi data monitoring gagal", 400, parsed.error.flatten());
  if (
    checked.module === "unras" &&
    !hasRequiredUnrasMetrics({
      crowdEstimate:
        "crowdEstimate" in parsed.data ? parsed.data.crowdEstimate : checked.record.crowdEstimate,
      personnel: "personnel" in parsed.data ? parsed.data.personnel : checked.record.personnel,
    })
  ) {
    return apiError("Estimasi massa dan personel pengamanan wajib diisi untuk Unras", 400);
  }
  const record = await prisma.operationalRecord.update({ where: { id: checked.id }, data: parsed.data });
  await writeAuditLog({
    request,
    principal: checked.principal,
    action: "UPDATE_MONITORING",
    entity: "OperationalRecord",
    entityId: record.id,
    oldValue: auditJson(checked.record),
    newValue: auditJson(record),
    metadata: { module: checked.module, role: checked.principal.role },
  });
  await publishRealtimeEvent({
    resource: "monitoring",
    action: "update",
    id: record.id,
    module: checked.module,
  });
  return NextResponse.json(record);
}

export async function DELETE(request: Request, { params }: Context) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const checked = await context(params);
  if ("error" in checked) return checked.error;
  await prisma.operationalRecord.delete({ where: { id: checked.id } });
  await writeAuditLog({
    request,
    principal: checked.principal,
    action: "DELETE_MONITORING",
    entity: "OperationalRecord",
    entityId: checked.id,
    oldValue: auditJson(checked.record),
    metadata: { module: checked.module, role: checked.principal.role },
  });
  await publishRealtimeEvent({
    resource: "monitoring",
    action: "delete",
    id: checked.id,
    module: checked.module,
  });
  return NextResponse.json({ ok: true });
}
