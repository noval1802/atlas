import type { Profile } from "next-auth";
import { prisma } from "@/lib/prisma";
import { mapClaimsToKodamScope, mapGroupsToRole } from "./group-mapping";
import { isAppRole, type AppRole } from "./roles";

type AtlasProfile = Profile & Record<string, unknown>;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function syncIdentityUser(profile: AtlasProfile) {
  const externalIdentityId = text(profile.sub);
  if (!externalIdentityId) throw new Error("OIDC subject claim is required");
  const username = text(profile.preferred_username) ?? externalIdentityId;
  const name = text(profile.name) ?? username;
  const email = text(profile.email);
  const claimRole = mapGroupsToRole(profile.groups) ?? "PIMPINAN";
  const claimScope = mapClaimsToKodamScope(profile);
  const kodam = claimScope.length
    ? await prisma.kodam.findFirst({ where: { code: { in: claimScope } }, select: { id: true, code: true } })
    : null;
  const existing = await prisma.user.findFirst({
    where: { OR: [{ externalIdentityId }, { username }] },
    include: { kodam: true },
  });
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { externalIdentityId, name, email, lastLoginAt: new Date() },
        include: { kodam: true },
      })
    : await prisma.user.create({
        data: {
          externalIdentityId,
          username,
          name,
          email,
          role: claimRole,
          kodamId: kodam?.id,
          lastLoginAt: new Date(),
        },
        include: { kodam: true },
      });
  const role: AppRole =
    user.role === "ADMINISTRATOR" ? "ADMIN" : isAppRole(user.role) ? user.role : claimRole;
  const kodamScope = user.kodam?.code ? [user.kodam.code] : claimScope;
  return { ...user, role, kodamScope };
}
