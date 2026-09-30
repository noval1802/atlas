import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { apiError, authorizationError } from "@/http/api-response";
import { prisma } from "@/lib/prisma";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation, readJsonBody } from "@/security/request-security";
import { publishRealtimeEvent } from "@/lib/realtime-publisher";

const layoutSchema = z.object({
  annotationId: z.string().trim().min(1).max(160),
  offsetX: z.number().int().min(-5000).max(5000),
  offsetY: z.number().int().min(-5000).max(5000),
});

export async function GET() {
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "map:read");
  if (!access.ok) return authorizationError(access);
  return NextResponse.json(await prisma.mapAnnotationLayout.findMany({ orderBy: { updatedAt: "desc" } }));
}

export async function PUT(request: Request) {
  const blocked = protectMutation(request);
  if (blocked) return blocked;
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "map:write");
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = layoutSchema.safeParse(body.value);
  if (!parsed.success) return apiError("Posisi annotation tidak valid", 400, parsed.error.flatten());
  const previous = await prisma.mapAnnotationLayout.findUnique({
    where: { annotationId: parsed.data.annotationId },
  });
  const updatedBy = principal.id ?? principal.email ?? "unknown";
  const layout = await prisma.mapAnnotationLayout.upsert({
    where: { annotationId: parsed.data.annotationId },
    update: { offsetX: parsed.data.offsetX, offsetY: parsed.data.offsetY, updatedBy },
    create: { ...parsed.data, updatedBy },
  });
  await writeAuditLog({
    request,
    principal,
    action: "UPDATE_MAP_LAYOUT",
    entity: "MapAnnotationLayout",
    entityId: layout.id,
    oldValue: auditJson(previous),
    newValue: auditJson(layout),
  });
  await publishRealtimeEvent({ resource: "map-layouts", action: "update", id: layout.annotationId });
  return NextResponse.json(layout);
}

export async function DELETE(request: Request) {
  const blocked = protectMutation(request, 10);
  if (blocked) return blocked;
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "map:write");
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  const previous = await prisma.mapAnnotationLayout.findMany();
  await prisma.mapAnnotationLayout.deleteMany();
  await writeAuditLog({
    request,
    principal,
    action: "RESET_MAP_LAYOUT",
    entity: "MapAnnotationLayout",
    oldValue: auditJson(previous),
    metadata: { count: previous.length },
  });
  await publishRealtimeEvent({ resource: "map-layouts", action: "reset" });
  return NextResponse.json({ ok: true });
}
