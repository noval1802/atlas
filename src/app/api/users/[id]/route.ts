import { NextResponse } from "next/server";
import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { apiError, authorizationError } from "@/http/api-response";
import { prisma } from "@/lib/prisma";
import { userManagementSchema } from "@/operations/schema";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation, readJsonBody } from "@/security/request-security";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const blocked = protectMutation(request, 30);
  if (blocked) return blocked;
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "user:manage");
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const { id } = await params;
  const previous = await prisma.user.findUnique({ where: { id }, include: { kodam: true } });
  if (!previous) return apiError("Pengguna tidak ditemukan", 404);
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = userManagementSchema.safeParse(body.value);
  if (!parsed.success) return apiError("Konfigurasi pengguna tidak valid", 400, parsed.error.flatten());
  const kodam = parsed.data.kodamCode
    ? await prisma.kodam.findUnique({ where: { code: parsed.data.kodamCode } })
    : null;
  if (parsed.data.kodamCode && !kodam) return apiError("Kodam tidak ditemukan", 400);
  if (parsed.data.role === "OPERATOR_KODAM" && !kodam)
    return apiError("Operator Kodam wajib memiliki cakupan Kodam", 400);
  const user = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role, status: parsed.data.status, kodamId: kodam?.id ?? null },
    include: { kodam: true },
  });
  await writeAuditLog({
    request,
    principal,
    action: "UPDATE_USER_ACCESS",
    entity: "User",
    entityId: id,
    oldValue: auditJson(previous),
    newValue: auditJson(user),
  });
  return NextResponse.json(user);
}
