import type { Prisma } from "@prisma/client";
import type { AuthPrincipal } from "@/auth/authorize";
import { prisma } from "@/lib/prisma";
import { requestContext } from "./request-security";

type AuditInput = {
  request: Request;
  principal: AuthPrincipal;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
};

export function auditJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function writeAuditLog(input: AuditInput): Promise<void> {
  const context = requestContext(input.request);
  const localUser = input.principal.id
    ? await prisma.user.findFirst({
        where: { OR: [{ id: input.principal.id }, { externalIdentityId: input.principal.id }] },
        select: { id: true },
      })
    : null;
  await prisma.auditLog.create({
    data: {
      userId: localUser?.id,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      oldValue: input.oldValue,
      newValue: input.newValue,
      metadata: input.metadata ?? {
        actor: input.principal.name ?? input.principal.email ?? input.principal.id ?? "unknown",
        role: input.principal.role,
      },
      ...context,
    },
  });
}
