import { NextResponse } from "next/server";
import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { apiError, authorizationError } from "@/http/api-response";
import { prisma } from "@/lib/prisma";
import { publishRealtimeEvent } from "@/lib/realtime-publisher";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation } from "@/security/request-security";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Context) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "map:write");
  if (!access.ok) return authorizationError(access);
  const { id } = await params;
  const point = await prisma.mapPoint.findUnique({ where: { id } });
  if (!point) return apiError("Titik peta tidak ditemukan", 404);
  await prisma.mapPoint.delete({ where: { id } });
  await writeAuditLog({
    request,
    principal: principal!,
    action: "DELETE_MAP_POINT",
    entity: "MapPoint",
    entityId: id,
    oldValue: auditJson(point),
  });
  await publishRealtimeEvent({ resource: "map-points", action: "delete", id });
  return NextResponse.json({ ok: true });
}
