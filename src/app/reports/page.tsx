import { redirect } from "next/navigation";
import { authorize, scopedKodamCodes } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { ReportManager } from "@/components/reports/report-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "report:read");
  if (!access.ok || !principal) redirect("/dashboard");
  const scope = scopedKodamCodes(principal);
  const [reports, kodams] = await Promise.all([
    prisma.report.findMany({
      where: scope ? { kodam: { code: { in: scope } } } : undefined,
      include: { kodam: true },
      orderBy: { reportDate: "desc" },
      take: 500,
    }),
    prisma.kodam.findMany({
      where: scope ? { code: { in: scope } } : undefined,
      select: { code: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return (
    <AppShell>
      <ReportManager
        initialRows={reports}
        kodams={kodams}
        canCreate={authorize(principal, "report:create").ok}
        canUpdate={authorize(principal, "report:update").ok}
        canDelete={authorize(principal, "report:delete").ok}
        canApprove={["SUPER_ADMIN", "ADMIN", "OPERATOR_PUSDALOPS"].includes(principal.role)}
      />
    </AppShell>
  );
}
