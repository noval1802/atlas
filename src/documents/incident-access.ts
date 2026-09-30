import type { Permission } from "@/auth/permissions";
import type { AuthPrincipal } from "@/auth/authorize";
import { authorizeIncident } from "@/incidents/access";
import { prisma } from "@/lib/prisma";

export type IncidentDocumentAccess =
  | { ok: true; principal: AuthPrincipal; incident: { id: string; kodam: { code: string } } }
  | { ok: false; status: 401 | 403 | 404; error: string };

export async function authorizeIncidentDocument(
  incidentId: string,
  permission: Permission,
): Promise<IncidentDocumentAccess> {
  const access = await authorizeIncident(incidentId, permission);
  if (!access.ok) return access;
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    select: { id: true, kodam: { select: { code: true } } },
  });
  if (!incident) return { ok: false, status: 404, error: "Kejadian tidak ditemukan" };
  return { ok: true, principal: access.principal, incident };
}
