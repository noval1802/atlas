import { notFound } from "next/navigation";
import { Activity, ArrowLeft, MapPin, PackageOpen, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { kodams } from "@/data/kodam";
import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { prisma } from "@/lib/prisma";
export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.kodam.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  if (!row) notFound();
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "kodam:read", row.code);
  if (!access.ok) notFound();
  const base = kodams.find((item) => item.id === row.slug || item.code === row.code);
  const k = {
    ...row,
    id: row.slug ?? row.id,
    logo: row.logoFilename
      ? `/api/kodams/${encodeURIComponent(row.slug ?? row.id)}/logo?v=${encodeURIComponent(row.logoUpdatedAt?.toISOString() ?? "1")}`
      : (base?.logo ?? "/kodam/default-kotamaops.svg"),
    incidents: row.incidentCount,
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
  };
  const incidents = await prisma.incident.findMany({
    where: { kodamId: row.id },
    orderBy: { incidentDate: "desc" },
    take: 4,
  });
  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px] space-y-5">
        <Link
          href="/kodam"
          className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-cyan-300"
        >
          <ArrowLeft size={14} />
          Kembali ke Data Kotamaops
        </Link>
        <section className="panel rounded-xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 rounded-xl border border-slate-800 bg-slate-950/40 p-2">
                <Image
                  src={k.logo}
                  alt={`Logo ${k.name}`}
                  fill
                  sizes="80px"
                  className="object-contain p-2"
                  unoptimized={k.logo.startsWith("/api/")}
                />
              </div>
              <div>
                <p className="font-mono text-xs text-cyan-400">KOTAMAOPS • {k.code}</p>
                <h1 className="mt-2 text-2xl font-semibold">{k.name}</h1>
                <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={13} />
                  {k.location}, {k.region}
                </p>
              </div>
            </div>
            <StatusBadge status={k.status} className="px-4 py-2" />
          </div>
        </section>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Total Kejadian", k.incidents, Activity],
            ["Personel", k.personnel.toLocaleString("id-ID"), Users],
            ["Dikerahkan", k.deployed.toLocaleString("id-ID"), Users],
            ["Alut Siap", "84", PackageOpen],
          ].map(([l, v, I]) => {
            const Icon = I as typeof Activity;
            return (
              <div className="panel rounded-xl p-4" key={String(l)}>
                <Icon size={18} className="text-cyan-400" />
                <p className="mt-4 text-xl font-semibold">{v as string}</p>
                <p className="text-[10px] text-slate-500">{l as string}</p>
              </div>
            );
          })}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="panel rounded-xl p-4">
            <h2 className="text-xs font-semibold tracking-wide">KOORDINAT & WILAYAH</h2>
            <div className="mt-4 flex h-64 items-center justify-center rounded-lg border border-slate-800 bg-[radial-gradient(circle,#164e63_1px,transparent_1px)] [background-size:20px_20px]">
              <div className="text-center">
                <MapPin className="mx-auto text-cyan-400" />
                <p className="mt-2 font-mono text-xs">
                  {k.latitude}, {k.longitude}
                </p>
              </div>
            </div>
          </section>
          <section className="panel rounded-xl p-4">
            <h2 className="text-xs font-semibold tracking-wide">KEJADIAN TERBARU</h2>
            <div className="mt-3 space-y-2">
              {incidents.map((i) => (
                <div key={i.id} className="rounded-lg border border-slate-800 p-3">
                  <div className="flex justify-between">
                    <p className="text-xs font-medium">
                      {i.category} • {i.location}
                    </p>
                    <StatusBadge status={i.status} />
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">
                    {i.incidentTime} WIB — {i.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
