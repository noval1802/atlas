import { NextResponse } from "next/server";
import { OperationalStatus } from "@prisma/client";
import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { kodams } from "@/data/kodam";
import { apiError, authorizationError } from "@/http/api-response";
import { prisma } from "@/lib/prisma";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation } from "@/security/request-security";

export async function POST(request: Request) {
  const blocked = protectMutation(request, 5);
  if (blocked) return blocked;
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "kodam:reset");
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const previous = await prisma.kodam.findMany();
  const rows = await prisma.$transaction(
    kodams.map((kodam) =>
      prisma.kodam.update({
        where: { code: kodam.code },
        data: {
          slug: kodam.id,
          name: kodam.name,
          region: kodam.region,
          location: kodam.location,
          latitude: kodam.latitude,
          longitude: kodam.longitude,
          status: kodam.status as OperationalStatus,
          personnel: kodam.personnel,
          incidentCount: kodam.incidents,
          deployed: kodam.deployed,
        },
      }),
    ),
  );
  await writeAuditLog({
    request,
    principal,
    action: "RESET_KODAM",
    entity: "Kodam",
    oldValue: auditJson(previous),
    newValue: auditJson(rows),
    metadata: { role: principal.role },
  });
  return NextResponse.json(rows);
}
