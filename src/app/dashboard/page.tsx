import {
  Activity,
  Clock3,
  Flame,
  MapPinned,
  Megaphone,
  Radio,
  ShieldAlert,
  Siren,
  TowerControl,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SectionTitle } from "@/components/dashboard/section-title";
import { IncidentTable } from "@/components/dashboard/incident-table";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { IncidentChart } from "@/components/dashboard/incident-chart";
import { MapLoader } from "@/components/map/map-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";
import type { AlertItem, Incident, Status } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 6);
  const [moduleGroups, securityCount, incidentsRaw, recentIncidents, recentMonitoring, alertsRaw] =
    await Promise.all([
      prisma.operationalRecord.groupBy({ by: ["module"], _count: { _all: true } }),
      prisma.incident.count({ where: { category: { contains: "keamanan", mode: "insensitive" } } }),
      prisma.incident.findMany({ include: { kodam: true }, orderBy: { incidentDate: "desc" }, take: 100 }),
      prisma.incident.findMany({
        where: { incidentDate: { gte: since } },
        select: { category: true, incidentDate: true },
      }),
      prisma.operationalRecord.findMany({
        where: { createdAt: { gte: since } },
        select: { module: true, createdAt: true },
      }),
      prisma.alert.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    ]);
  const moduleCount = Object.fromEntries(moduleGroups.map((row) => [row.module, row._count._all]));
  const total =
    (moduleCount.bencana ?? 0) + (moduleCount.karhutla ?? 0) + (moduleCount.unras ?? 0) + securityCount;
  const reportedKodams = new Set(incidentsRaw.map((incident) => incident.kodamId)).size;
  const kpis = [
    { label: "Total Kejadian", value: total, change: 0, icon: Activity, tone: "cyan" },
    { label: "Bencana Alam", value: moduleCount.bencana ?? 0, change: 0, icon: Siren, tone: "blue" },
    { label: "Karhutla", value: moduleCount.karhutla ?? 0, change: 0, icon: Flame, tone: "orange" },
    { label: "Unras", value: moduleCount.unras ?? 0, change: 0, icon: Megaphone, tone: "yellow" },
    { label: "Gangguan Keamanan", value: securityCount, change: 0, icon: ShieldAlert, tone: "red" },
    { label: "Kodam Melapor", value: reportedKodams, change: 0, icon: TowerControl, tone: "emerald" },
  ];
  const incidents: Incident[] = incidentsRaw.map((incident) => ({
    id: incident.id,
    time: incident.incidentTime,
    eventDate: incident.incidentDate.toISOString(),
    kodamId: incident.kodamId,
    kodam: incident.kodam.name,
    location: incident.location,
    category: incident.category,
    description: incident.description,
    status: incident.status as Status,
    personnel: incident.personnel,
    latitude: incident.latitude ?? incident.kodam.latitude ?? 0,
    longitude: incident.longitude ?? incident.kodam.longitude ?? 0,
    source: incident.source,
  }));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(since);
    date.setDate(since.getDate() + index);
    return {
      date,
      key: date.toISOString().slice(0, 10),
      day: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date),
      bencana: 0,
      karhutla: 0,
      unras: 0,
      keamanan: 0,
    };
  });
  const byDay = new Map(days.map((day) => [day.key, day]));
  for (const record of recentMonitoring) {
    const day = byDay.get(record.createdAt.toISOString().slice(0, 10));
    if (day && record.module in day) day[record.module as "bencana" | "karhutla" | "unras"]++;
  }
  for (const incident of recentIncidents) {
    const day = byDay.get(incident.incidentDate.toISOString().slice(0, 10));
    if (day && /keamanan/i.test(incident.category)) day.keamanan++;
  }
  const chart = days.map((day) => ({
    day: day.day,
    bencana: day.bencana,
    karhutla: day.karhutla,
    unras: day.unras,
    keamanan: day.keamanan,
  }));
  const nationalStatus: Status = incidentsRaw.some((incident) => incident.status === "SIAGA")
    ? "SIAGA"
    : incidentsRaw.some((incident) => incident.status === "WASPADA")
      ? "WASPADA"
      : "KONDUSIF";
  const now = new Date();
  const alertItems: AlertItem[] = alertsRaw.map((alert) => {
    const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - alert.createdAt.getTime()) / 60_000));
    return {
      id: alert.id,
      level: alert.level,
      kodam: alert.kodam,
      title: alert.title,
      detail: alert.message,
      metric: alert.metric,
      status: alert.status,
      time:
        elapsedMinutes < 60 ? `${elapsedMinutes} menit lalu` : `${Math.floor(elapsedMinutes / 60)} jam lalu`,
    };
  });
  return (
    <AppShell>
      <div className="mx-auto max-w-[1800px] space-y-4">
        <section className="panel relative overflow-hidden rounded-xl p-4 sm:p-5">
          <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10">
                <Radio size={19} className="text-emerald-400" />
                <i className="pulse-dot absolute inset-1 rounded-full border border-emerald-400/30" />
              </span>
              <div>
                <p className="text-[9px] font-semibold tracking-[.2em] text-slate-500">
                  STATUS MONITORING TERKINI
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-wide">SITUASI NASIONAL</h2>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-7">
              <div className="hidden text-right sm:block">
                <p className="text-[9px] text-slate-500">TERAKHIR DIPERBARUI</p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-300">
                  <Clock3 size={12} /> {now.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
                </p>
              </div>
              <StatusBadge status={nationalStatus} className="px-4 py-2 text-[11px]" />
            </div>
          </div>
        </section>
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {kpis.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </section>
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="panel overflow-hidden rounded-xl">
            <SectionTitle
              icon={MapPinned}
              title="PETA SITUASI NASIONAL"
              action={
                <div className="flex gap-3 text-[9px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <i className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Kondusif
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Waspada
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    Siaga
                  </span>
                </div>
              }
            />
            <MapLoader />
          </div>
          <aside className="panel overflow-hidden rounded-xl">
            <SectionTitle
              icon={Radio}
              title="EARLY WARNING"
              action={
                <span className="rounded-full bg-rose-500/10 px-2 py-1 text-[9px] text-rose-400">
                  {alertItems.length} AKTIF
                </span>
              }
            />
            <AlertPanel data={alertItems} />
          </aside>
        </section>
        <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.65fr)_minmax(380px,.75fr)]">
          <div className="panel overflow-hidden rounded-xl">
            <SectionTitle
              icon={Activity}
              title="KEJADIAN TERBARU"
              action={<button className="text-[10px] text-cyan-400">Lihat semua →</button>}
            />
            <IncidentTable data={incidents} total={incidentsRaw.length} />
          </div>
          <div className="panel overflow-hidden rounded-xl">
            <SectionTitle icon={TrendingUp} title="TREN KEJADIAN 7 HARI" />
            <IncidentChart data={chart} />
            <div className="flex flex-wrap gap-4 border-t border-slate-800 px-4 py-3 text-[9px] text-slate-500">
              <span>
                <i className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Bencana
              </span>
              <span>
                <i className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-orange-400" />
                Karhutla
              </span>
              <span>
                <i className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" />
                Unras
              </span>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
