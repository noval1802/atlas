import { NextResponse } from "next/server";
import { authorize, scopedKodamCodes } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { prisma } from "@/lib/prisma";
import { incidentSchema } from "@/lib/validation";
import { apiError, authorizationError } from "@/http/api-response";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation, readJsonBody } from "@/security/request-security";
import { publishRealtimeEvent } from "@/lib/realtime-publisher";

export async function GET(request: Request) {
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "incident:read");
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const requestedKodam = new URL(request.url).searchParams.get("kodam")?.toUpperCase();
  if (requestedKodam) {
    const scoped = authorize(principal, "incident:read", requestedKodam);
    if (!scoped.ok) return authorizationError(scoped);
  }
  const scope = scopedKodamCodes(principal);
  try {
    const where = requestedKodam
      ? { kodam: { code: requestedKodam } }
      : scope
        ? { kodam: { code: { in: scope } } }
        : undefined;
    return NextResponse.json(
      await prisma.incident.findMany({
        where,
        include: { kodam: true },
        orderBy: { incidentDate: "desc" },
        take: 100,
      }),
    );
  } catch {
    return apiError("Database belum terhubung", 503);
  }
}

export async function POST(request: Request) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "incident:create");
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = incidentSchema.safeParse(body.value);
  if (!parsed.success) return apiError("Validasi gagal", 400, parsed.error.flatten());
  try {
    const kodam = await prisma.kodam.findUnique({
      where: { id: parsed.data.kodamId },
      select: { code: true, latitude: true, longitude: true },
    });
    if (!kodam) return apiError("Kodam tidak ditemukan", 400);
    if (kodam.latitude === null || kodam.longitude === null)
      return apiError("Koordinat Kodam belum dikonfigurasi", 400);
    const scoped = authorize(principal, "incident:create", kodam.code);
    if (!scoped.ok) return authorizationError(scoped);
    const incident = await prisma.incident.create({
      data: { ...parsed.data, latitude: kodam.latitude, longitude: kodam.longitude },
    });
    await writeAuditLog({
      request,
      principal,
      action: "CREATE_INCIDENT",
      entity: "Incident",
      entityId: incident.id,
      newValue: auditJson(incident),
    });
    await publishRealtimeEvent({ resource: "incidents", action: "create", id: incident.id });
    return NextResponse.json(incident, { status: 201 });
  } catch {
    return apiError("Kejadian gagal disimpan", 500);
  }
}
