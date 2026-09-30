import { NextResponse } from "next/server";
import { authorize, scopedKodamCodes } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { apiError, authorizationError } from "@/http/api-response";
import { kodamCreateSchema } from "@/kodams/schema";
import { prisma } from "@/lib/prisma";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation, readJsonBody } from "@/security/request-security";

export async function GET() {
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "kodam:read");
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const scope = scopedKodamCodes(principal);
  return NextResponse.json(
    await prisma.kodam.findMany({
      where: scope ? { code: { in: scope } } : undefined,
      orderBy: { name: "asc" },
    }),
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(code: string) {
  const base = slugify(code) || "kotamaops";
  let candidate = base;
  let suffix = 2;
  while (await prisma.kodam.findFirst({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export async function POST(request: Request) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "kodam:create");
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = kodamCreateSchema.safeParse(body.value);
  if (!parsed.success) return apiError("Validasi Kotamaops gagal", 400, parsed.error.flatten());

  const code = parsed.data.code.toUpperCase();
  const duplicate = await prisma.kodam.findFirst({
    where: { code: { equals: code, mode: "insensitive" } },
    select: { id: true },
  });
  if (duplicate) return apiError("Kode Kotamaops sudah digunakan", 409);

  const created = await prisma.kodam.create({
    data: {
      ...parsed.data,
      code,
      slug: await uniqueSlug(code),
      incidentCount: 0,
    },
  });
  await writeAuditLog({
    request,
    principal,
    action: "CREATE_KOTAMAOPS",
    entity: "Kodam",
    entityId: created.id,
    newValue: auditJson(created),
    metadata: { code: created.code, role: principal.role },
  });
  return NextResponse.json(created, { status: 201 });
}
