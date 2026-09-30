import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { IncidentManager } from "@/components/incidents/incident-manager";
export default function Page() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1800px] space-y-5">
        <PageHeader
          eyebrow="INCIDENT MANAGEMENT"
          title="Data Kejadian"
          description="Tambah, lihat, perbarui, dan kelola seluruh kejadian operasional"
        />
        <IncidentManager />
      </div>
    </AppShell>
  );
}
