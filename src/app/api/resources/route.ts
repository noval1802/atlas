import { NextResponse } from "next/server";
import { authorize, scopedKodamCodes } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { apiError, authorizationError } from "@/http/api-response";
import { prisma } from "@/lib/prisma";
import { resourceSchema } from "@/operations/schema";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation, readJsonBody } from "@/security/request-security";

export async function GET() {
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "resources:read");
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const scope = scopedKodamCodes(principal);
  return NextResponse.json(
    await prisma.resource.findMany({
      where: scope ? { kodam: { code: { in: scope } } } : undefined,
      include: { kodam: true },
      orderBy: [{ kodam: { name: "asc" } }, { type: "asc" }, { name: "asc" }],
    }),
  );
}

export async function POST(request: Request) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "resources:write");
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = resourceSchema.safeParse(body.value);
  if (!parsed.success) return apiError("Data sumber daya tidak valid", 400, parsed.error.flatten());
  const kodam = await prisma.kodam.findUnique({ where: { code: parsed.data.kodamCode } });
  if (!kodam) return apiError("Kodam tidak ditemukan", 400);
  const scoped = authorize(principal, "resources:write", kodam.code);
  if (!scoped.ok) return authorizationError(scoped);
  const resource = await prisma.resource.create({
    data: {
      type: parsed.data.type,
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      deployed: parsed.data.deployed,
      status: parsed.data.status,
      kodamId: kodam.id,
      createdBy: principal.id ?? principal.email ?? "unknown",
    },
    include: { kodam: true },
  });
  await writeAuditLog({
    request,
    principal,
    action: "CREATE_RESOURCE",
    entity: "Resource",
    entityId: resource.id,
    newValue: auditJson(resource),
  });
  return NextResponse.json(resource, { status: 201 });
}
