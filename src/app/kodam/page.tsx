import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { KodamManager } from "@/components/kodam/kodam-manager";
import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";

export default async function KodamPage() {
  const principal = await getAuthPrincipal();
  return (
    <AppShell>
      <div className="mx-auto max-w-[1800px] space-y-5">
        <PageHeader
          eyebrow="DATA KEWILAYAHAN"
          title="Data Kotamaops"
          description="Kelola data, kekuatan, dan koordinat Komando Utama Operasi"
        />
        <KodamManager
          canCreate={authorize(principal, "kodam:create").ok}
          canDelete={authorize(principal, "kodam:delete").ok}
          canReset={authorize(principal, "kodam:reset").ok}
        />
      </div>
    </AppShell>
  );
}
