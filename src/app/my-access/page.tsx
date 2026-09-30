import { redirect } from "next/navigation";
import { CheckCircle2, KeyRound, MapPinned, ShieldCheck, User } from "lucide-react";
import { getAuthPrincipal } from "@/auth/session";
import { ROLE_PERMISSIONS } from "@/auth/permissions";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";

export default async function MyAccessPage() {
  const principal = await getAuthPrincipal();
  if (!principal) redirect("/login");
  const permissions = ROLE_PERMISSIONS[principal.role];
  const entries = permissions === "*" ? ["Semua permission ATLAS"] : permissions;
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-5">
        <PageHeader
          eyebrow="IDENTITY & AUTHORIZATION"
          title="Akses Saya"
          description="Identitas SSO, role aplikasi, cakupan Kodam, dan permission efektif"
        />
        <section className="grid gap-4 md:grid-cols-3">
          <div className="panel rounded-xl p-5">
            <User size={18} className="text-cyan-400" />
            <p className="mt-4 text-sm font-semibold">{principal.name ?? "Pengguna ATLAS"}</p>
            <p className="mt-1 text-xs text-slate-500">{principal.email ?? principal.id}</p>
          </div>
          <div className="panel rounded-xl p-5">
            <ShieldCheck size={18} className="text-emerald-400" />
            <p className="mt-4 text-sm font-semibold">{principal.role}</p>
            <p className="mt-1 text-xs text-slate-500">Role efektif ATLAS</p>
          </div>
          <div className="panel rounded-xl p-5">
            <MapPinned size={18} className="text-amber-400" />
            <p className="mt-4 text-sm font-semibold">
              {principal.kodamScope.length ? principal.kodamScope.join(", ") : "NASIONAL"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Cakupan wilayah</p>
          </div>
        </section>
        <section className="panel rounded-xl p-5">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-cyan-400" />
            <h2 className="text-xs font-semibold tracking-wider">PERMISSION EFEKTIF</h2>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((permission) => (
              <div
                key={permission}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] text-slate-300"
              >
                <CheckCircle2 size={13} className="text-emerald-400" />
                {permission}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
