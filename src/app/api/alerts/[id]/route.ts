import { NextResponse } from "next/server";
import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { alertSchema } from "@/alerts/schema";
import { apiError, authorizationError } from "@/http/api-response";
import { prisma } from "@/lib/prisma";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation, readJsonBody } from "@/security/request-security";

type Context = { params: Promise<{ id: string }> };

async function checked(params: Context["params"]) {
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "alert:write");
  if (!access.ok) return { error: authorizationError(access) } as const;
  const { id } = await params;
  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert) return { error: apiError("Early warning tidak ditemukan", 404) } as const;
  return { principal: principal!, id, alert } as const;
}

export async function PUT(request: Request, { params }: Context) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const context = await checked(params);
  if ("error" in context) return context.error;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = alertSchema.partial().safeParse(body.value);
  if (!parsed.success) return apiError("Data early warning tidak valid", 400, parsed.error.flatten());
  const alert = await prisma.alert.update({ where: { id: context.id }, data: parsed.data });
  await writeAuditLog({
    request,
    principal: context.principal,
    action: "UPDATE_ALERT",
    entity: "Alert",
    entityId: alert.id,
    oldValue: auditJson(context.alert),
    newValue: auditJson(alert),
  });
  return NextResponse.json(alert);
}

export async function DELETE(request: Request, { params }: Context) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const context = await checked(params);
  if ("error" in context) return context.error;
  await prisma.alert.delete({ where: { id: context.id } });
  await writeAuditLog({
    request,
    principal: context.principal,
    action: "DELETE_ALERT",
    entity: "Alert",
    entityId: context.id,
    oldValue: auditJson(context.alert),
  });
  return NextResponse.json({ ok: true });
}
