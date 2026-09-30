import { NextResponse } from "next/server";
import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { apiError, authorizationError } from "@/http/api-response";
import { prisma } from "@/lib/prisma";
import { publishRealtimeEvent } from "@/lib/realtime-publisher";
import { mapPointSchema } from "@/map-points/schema";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation, readJsonBody } from "@/security/request-security";

export async function GET() {
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "map:read");
  if (!access.ok) return authorizationError(access);
  return NextResponse.json(await prisma.mapPoint.findMany({ orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "map:write");
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = mapPointSchema.safeParse(body.value);
  if (!parsed.success) return apiError("Data titik peta tidak valid", 400, parsed.error.flatten());
  const point = await prisma.mapPoint.create({
    data: { ...parsed.data, createdBy: principal.id ?? principal.email ?? "unknown" },
  });
  await writeAuditLog({
    request,
    principal,
    action: "CREATE_MAP_POINT",
    entity: "MapPoint",
    entityId: point.id,
    newValue: auditJson(point),
  });
  await publishRealtimeEvent({ resource: "map-points", action: "create", id: point.id });
  return NextResponse.json(point, { status: 201 });
}
