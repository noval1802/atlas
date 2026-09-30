import { NextResponse } from "next/server";
import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { apiError, authorizationError } from "@/http/api-response";
import { prisma } from "@/lib/prisma";
import { resourceSchema } from "@/operations/schema";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation, readJsonBody } from "@/security/request-security";

type Context = { params: Promise<{ id: string }> };

async function contextFor(params: Context["params"]) {
  const principal = await getAuthPrincipal();
  const basic = authorize(principal, "resources:write");
  if (!basic.ok) return { error: authorizationError(basic) } as const;
  const { id } = await params;
  const resource = await prisma.resource.findUnique({ where: { id }, include: { kodam: true } });
  if (!resource) return { error: apiError("Sumber daya tidak ditemukan", 404) } as const;
  const scoped = authorize(principal, "resources:write", resource.kodam.code);
  if (!scoped.ok) return { error: authorizationError(scoped) } as const;
  return { principal: principal!, resource, id } as const;
}

export async function PUT(request: Request, { params }: Context) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const checked = await contextFor(params);
  if ("error" in checked) return checked.error;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = resourceSchema.safeParse(body.value);
  if (!parsed.success) return apiError("Data sumber daya tidak valid", 400, parsed.error.flatten());
  const kodam = await prisma.kodam.findUnique({ where: { code: parsed.data.kodamCode } });
  if (!kodam) return apiError("Kodam tidak ditemukan", 400);
  const target = authorize(checked.principal, "resources:write", kodam.code);
  if (!target.ok) return authorizationError(target);
  const resource = await prisma.resource.update({
    where: { id: checked.id },
    data: {
      type: parsed.data.type,
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      deployed: parsed.data.deployed,
      status: parsed.data.status,
      kodamId: kodam.id,
    },
    include: { kodam: true },
  });
  await writeAuditLog({
    request,
    principal: checked.principal,
    action: "UPDATE_RESOURCE",
    entity: "Resource",
    entityId: resource.id,
    oldValue: auditJson(checked.resource),
    newValue: auditJson(resource),
  });
  return NextResponse.json(resource);
}

export async function DELETE(request: Request, { params }: Context) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const checked = await contextFor(params);
  if ("error" in checked) return checked.error;
  await prisma.resource.delete({ where: { id: checked.id } });
  await writeAuditLog({
    request,
    principal: checked.principal,
    action: "DELETE_RESOURCE",
    entity: "Resource",
    entityId: checked.id,
    oldValue: auditJson(checked.resource),
  });
  return NextResponse.json({ ok: true });
}
