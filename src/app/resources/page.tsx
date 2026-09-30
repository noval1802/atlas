import { redirect } from "next/navigation";
import { authorize, scopedKodamCodes } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { ResourceManager } from "@/components/resources/resource-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "resources:read");
  if (!access.ok || !principal) redirect("/dashboard");
  const scope = scopedKodamCodes(principal);
  const [resources, kodams] = await Promise.all([
    prisma.resource.findMany({
      where: scope ? { kodam: { code: { in: scope } } } : undefined,
      include: { kodam: true },
      orderBy: [{ kodam: { name: "asc" } }, { type: "asc" }, { name: "asc" }],
    }),
    prisma.kodam.findMany({
      where: scope ? { code: { in: scope } } : undefined,
      select: { code: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return (
    <AppShell>
      <ResourceManager
        initialRows={resources}
        kodams={kodams}
        canWrite={authorize(principal, "resources:write").ok}
      />
    </AppShell>
  );
}
