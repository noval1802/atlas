import { NextResponse } from "next/server";
import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { apiError, authorizationError } from "@/http/api-response";
import { kodamUpdateSchema } from "@/kodams/schema";
import { prisma } from "@/lib/prisma";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation, readJsonBody } from "@/security/request-security";
import { deleteKodamLogo } from "@/kodams/logo-storage";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const { id } = await params;
  const principal = await getAuthPrincipal();
  const base = authorize(principal, "kodam:update");
  if (!base.ok) return authorizationError(base);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const current = await prisma.kodam.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  if (!current) return apiError("Kodam tidak ditemukan", 404);
  const scoped = authorize(principal, "kodam:update", current.code);
  if (!scoped.ok) return authorizationError(scoped);
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = kodamUpdateSchema.safeParse(body.value);
  if (!parsed.success) return apiError("Validasi Data Kodam gagal", 400, parsed.error.flatten());
  const updated = await prisma.kodam.update({ where: { id: current.id }, data: parsed.data });
  await writeAuditLog({
    request,
    principal,
    action: "UPDATE_KODAM",
    entity: "Kodam",
    entityId: current.id,
    oldValue: auditJson(current),
    newValue: auditJson(updated),
    metadata: { code: current.code, role: principal.role },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: Context) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const { id } = await params;
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "kodam:delete");
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);

  const current = await prisma.kodam.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      _count: {
        select: { users: true, incidents: true, resources: true, bangsitArchives: true },
      },
    },
  });
  if (!current) return apiError("Kotamaops tidak ditemukan", 404);

  const dependencies =
    current._count.users +
    current._count.incidents +
    current._count.resources +
    current._count.bangsitArchives;
  if (dependencies > 0) {
    return apiError(
      "Kotamaops masih digunakan oleh data lain. Pindahkan atau hapus data terkait terlebih dahulu.",
      409,
      current._count,
    );
  }

  const deleted = await prisma.kodam.delete({ where: { id: current.id } });
  await deleteKodamLogo(current.logoFilename).catch(() => undefined);
  await writeAuditLog({
    request,
    principal,
    action: "DELETE_KOTAMAOPS",
    entity: "Kodam",
    entityId: current.id,
    oldValue: auditJson(deleted),
    metadata: { code: current.code, role: principal.role },
  });
  return NextResponse.json({ ok: true });
}
