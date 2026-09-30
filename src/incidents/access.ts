import type { Permission } from "@/auth/permissions";
import { authorize, type AuthPrincipal } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { prisma } from "@/lib/prisma";

export type IncidentAccess =
  | { ok: true; principal: AuthPrincipal; kodamCode: string }
  | { ok: false; status: 401 | 403 | 404; error: string };

export async function authorizeIncident(incidentId: string, permission: Permission): Promise<IncidentAccess> {
  const principal = await getAuthPrincipal();
  const base = authorize(principal, permission);
  if (!base.ok) return base;

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    select: { kodam: { select: { code: true } } },
  });
  if (!incident) return { ok: false, status: 404, error: "Kejadian tidak ditemukan" };

  const scoped = authorize(principal, permission, incident.kodam.code);
  if (!scoped.ok) return scoped;
  if (!principal) return { ok: false, status: 401, error: "Autentikasi diperlukan" };
  return { ok: true, principal, kodamCode: incident.kodam.code };
}
