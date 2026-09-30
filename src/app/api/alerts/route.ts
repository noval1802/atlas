import { NextResponse } from "next/server";
import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { alertSchema } from "@/alerts/schema";
import { apiError, authorizationError } from "@/http/api-response";
import { prisma } from "@/lib/prisma";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation, readJsonBody } from "@/security/request-security";

export async function GET() {
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "alert:read");
  if (!access.ok) return authorizationError(access);
  return NextResponse.json(await prisma.alert.findMany({ orderBy: { createdAt: "desc" }, take: 200 }));
}

export async function POST(request: Request) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "alert:write");
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = alertSchema.safeParse(body.value);
  if (!parsed.success) return apiError("Data early warning tidak valid", 400, parsed.error.flatten());
  const alert = await prisma.alert.create({
    data: { ...parsed.data, createdBy: principal.id ?? principal.email ?? "unknown" },
  });
  await writeAuditLog({
    request,
    principal,
    action: "CREATE_ALERT",
    entity: "Alert",
    entityId: alert.id,
    newValue: auditJson(alert),
  });
  return NextResponse.json(alert, { status: 201 });
}
