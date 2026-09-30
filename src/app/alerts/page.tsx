import { Radio } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { SectionTitle } from "@/components/dashboard/section-title";
import { prisma } from "@/lib/prisma";
import type { AlertItem, AlertLevel, Status } from "@/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const records = await prisma.alert.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const alerts: AlertItem[] = records.map((alert) => ({
    id: alert.id,
    level: alert.level as AlertLevel,
    kodam: alert.kodam,
    title: alert.title,
    detail: alert.message,
    metric: alert.metric,
    status: alert.status as Status,
    time: new Intl.DateTimeFormat("id-ID", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(alert.createdAt),
  }));
  const counts = ["INFO", "WARNING", "CRITICAL"].map(
    (level) => records.filter((alert) => alert.level === level).length,
  );
  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px] space-y-5">
        <PageHeader
          eyebrow="EARLY WARNING SYSTEM"
          title="Peringatan Dini"
          description="Deteksi, klasifikasi, dan tindak lanjut peringatan operasional"
        />
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <section className="panel rounded-xl p-5">
            <h2 className="text-xs font-semibold tracking-wider">MATRIS RISIKO NASIONAL</h2>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {["INFO", "WARNING", "CRITICAL"].map((x, i) => (
                <div key={x} className="rounded-lg border border-slate-800 p-5 text-center">
                  <p
                    className={`text-3xl font-semibold ${i === 0 ? "text-cyan-400" : i === 1 ? "text-amber-400" : "text-rose-400"}`}
                  >
                    {counts[i]}
                  </p>
                  <p className="mt-2 text-[9px] tracking-widest text-slate-500">{x}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 h-72 rounded-lg border border-slate-800 bg-[radial-gradient(circle,#164e63_1px,transparent_1px)] [background-size:18px_18px]" />
          </section>
          <section className="panel overflow-hidden rounded-xl">
            <SectionTitle icon={Radio} title="ALERT AKTIF" />
            <AlertPanel data={alerts} />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
