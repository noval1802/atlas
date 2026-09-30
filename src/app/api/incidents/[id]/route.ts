import { NextResponse } from "next/server";
import { authorize } from "@/auth/authorize";
import { authorizeIncident } from "@/incidents/access";
import { apiError, authorizationError } from "@/http/api-response";
import { prisma } from "@/lib/prisma";
import { incidentSchema } from "@/lib/validation";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation, readJsonBody } from "@/security/request-security";
import { publishRealtimeEvent } from "@/lib/realtime-publisher";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const { id } = await params;
  const access = await authorizeIncident(id, "incident:read");
  if (!access.ok) return apiError(access.error, access.status);

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: { kodam: true, alerts: true },
  });
  return NextResponse.json(incident);
}

export async function PUT(request: Request, { params }: Context) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;

  const { id } = await params;
  const access = await authorizeIncident(id, "incident:update");
  if (!access.ok) return apiError(access.error, access.status);

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = incidentSchema.partial().safeParse(body.value);
  if (!parsed.success) return apiError("Validasi gagal", 400, parsed.error.flatten());

  const previous = await prisma.incident.findUnique({ where: { id } });
  if (!previous) return apiError("Kejadian tidak ditemukan", 404);
  const targetKodam = await prisma.kodam.findUnique({
    where: { id: parsed.data.kodamId ?? previous.kodamId },
    select: { code: true, latitude: true, longitude: true },
  });
  if (!targetKodam) return apiError("Kodam tidak ditemukan", 400);
  if (targetKodam.latitude === null || targetKodam.longitude === null)
    return apiError("Koordinat Kodam belum dikonfigurasi", 400);
  const targetAccess = authorize(access.principal, "incident:update", targetKodam.code);
  if (!targetAccess.ok) return authorizationError(targetAccess);
  const incident = await prisma.incident.update({
    where: { id },
    data: { ...parsed.data, latitude: targetKodam.latitude, longitude: targetKodam.longitude },
  });
  await writeAuditLog({
    request,
    principal: access.principal,
    action: "UPDATE_INCIDENT",
    entity: "Incident",
    entityId: id,
    oldValue: auditJson(previous),
    newValue: auditJson(incident),
  });
  await publishRealtimeEvent({ resource: "incidents", action: "update", id });
  return NextResponse.json(incident);
}

export async function DELETE(request: Request, { params }: Context) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;

  const { id } = await params;
  const access = await authorizeIncident(id, "incident:delete");
  if (!access.ok) return apiError(access.error, access.status);

  const previous = await prisma.incident.findUnique({ where: { id } });
  await prisma.incident.delete({ where: { id } });
  await writeAuditLog({
    request,
    principal: access.principal,
    action: "DELETE_INCIDENT",
    entity: "Incident",
    entityId: id,
    oldValue: auditJson(previous),
  });
  await publishRealtimeEvent({ resource: "incidents", action: "delete", id });
  return NextResponse.json({ ok: true });
}
