import Link from "next/link";
import { ArrowLeft, MapPin, ShieldAlert } from "lucide-react";
import { notFound } from "next/navigation";
import { authorize } from "@/auth/authorize";
import { hasPermission } from "@/auth/permissions";
import { getAuthPrincipal } from "@/auth/session";
import { RelatedDocuments } from "@/components/documents/related-documents";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";
export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const principal = await getAuthPrincipal();
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: { kodam: true, documents: { orderBy: { createdAt: "desc" } } },
  });
  if (!incident) notFound();
  const access = authorize(principal, "incident:read", incident.kodam.code);
  if (!access.ok || !principal)
    return (
      <AppShell>
        <div className="panel mx-auto max-w-2xl rounded-xl p-8 text-center">
          <ShieldAlert className="mx-auto text-rose-400" />
          <h1 className="mt-4 text-lg font-semibold">Akses ditolak</h1>
          <p className="mt-2 text-xs text-slate-500">Kejadian berada di luar cakupan akses Anda.</p>
          <Link href="/kejadian" className="mt-5 inline-block text-xs text-cyan-400">
            Kembali ke Kejadian
          </Link>
        </div>
      </AppShell>
    );
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-5">
        <Link
          href="/kejadian"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-300"
        >
          <ArrowLeft size={14} /> Kembali
        </Link>
        <section className="panel rounded-xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] text-cyan-400">{incident.id}</p>
              <h1 className="mt-2 text-xl font-semibold">{incident.title}</h1>
              <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <MapPin size={13} />
                {incident.location} • {incident.kodam.name}
              </p>
            </div>
            <StatusBadge status={incident.status} />
          </div>
          <p className="mt-5 border-t border-slate-800 pt-5 text-sm leading-7 text-slate-300">
            {incident.description}
          </p>
          <dl className="mt-5 grid gap-3 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-[9px] text-slate-600">KATEGORI</dt>
              <dd className="mt-1">{incident.category}</dd>
            </div>
            <div>
              <dt className="text-[9px] text-slate-600">WAKTU</dt>
              <dd className="mt-1">{incident.incidentTime} WIB</dd>
            </div>
            <div>
              <dt className="text-[9px] text-slate-600">PERSONEL</dt>
              <dd className="mt-1">{incident.personnel}</dd>
            </div>
            <div>
              <dt className="text-[9px] text-slate-600">SCOPE</dt>
              <dd className="mt-1">{incident.kodam.code}</dd>
            </div>
          </dl>
        </section>
        <RelatedDocuments
          incidentId={incident.id}
          canUpload={hasPermission(principal.role, "document:upload")}
          initialDocuments={incident.documents.map((document) => ({
            id: document.id,
            filename: document.filename,
            mimeType: document.mimeType,
            uploadedBy: document.uploadedBy,
            createdAt: document.createdAt.toISOString(),
          }))}
        />
      </div>
    </AppShell>
  );
}
