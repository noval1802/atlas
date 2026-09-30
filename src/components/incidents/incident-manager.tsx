"use client";
import Link from "next/link";
import { Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useIncidentsApi } from "@/hooks/use-incidents-api";
import type { Incident, Status } from "@/types";

const blank = {
  kodam: "Kodam Jaya",
  location: "",
  category: "Bencana Alam",
  description: "",
  status: "KONDUSIF" as Status,
  personnel: 0,
  latitude: -6.2,
  longitude: 106.8,
};

export function IncidentManager() {
  const { rows, kodams, loading, error, setError, save: saveIncident, remove } = useIncidentsApi();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Incident | null>(null);
  const [form, setForm] = useState(blank);
  function show(incident?: Incident) {
    setEdit(incident ?? null);
    setForm(
      incident
        ? {
            kodam: incident.kodam,
            location: incident.location,
            category: incident.category,
            description: incident.description,
            status: incident.status,
            personnel: incident.personnel,
            latitude: incident.latitude,
            longitude: incident.longitude,
          }
        : { ...blank, kodam: kodams[0]?.name ?? blank.kodam },
    );
    setOpen(true);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      await saveIncident(form, edit ?? undefined);
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kejadian gagal disimpan");
    }
  }
  const filtered = rows.filter((incident) =>
    `${incident.kodam} ${incident.location} ${incident.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="flex flex-wrap justify-between gap-3">
        <label className="panel flex min-w-64 items-center gap-2 rounded-lg px-3">
          <Search size={14} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari kejadian..."
            className="h-10 flex-1 bg-transparent text-xs outline-none"
          />
        </label>
        <button
          onClick={() => show()}
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 text-xs font-bold text-slate-950"
        >
          <Plus size={15} />
          Tambah Kejadian
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300"
        >
          {error}
        </p>
      )}
      <div className="panel overflow-x-auto rounded-xl">
        <table className="w-full min-w-[850px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-slate-800 text-[9px] text-slate-500">
              <th className="px-4 py-3">ID / WAKTU</th>
              <th>KODAM</th>
              <th>KATEGORI</th>
              <th>LOKASI</th>
              <th>PERSONEL</th>
              <th>STATUS</th>
              <th className="pr-4 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              filtered.map((incident) => (
                <tr key={incident.id} className="border-b border-slate-800/70 hover:bg-white/[.02]">
                  <td className="px-4 py-3 font-mono text-cyan-400">
                    {incident.id}
                    <small className="block text-slate-600">{incident.time} WIB</small>
                  </td>
                  <td>{incident.kodam}</td>
                  <td>{incident.category}</td>
                  <td>{incident.location}</td>
                  <td>{incident.personnel}</td>
                  <td>
                    <StatusBadge status={incident.status} />
                  </td>
                  <td className="pr-4 text-right">
                    <Link
                      href={`/kejadian/${incident.id}`}
                      className="inline-block p-2 text-slate-500 hover:text-white"
                      title="Detail dan dokumen"
                    >
                      <Eye size={14} />
                    </Link>
                    <button onClick={() => show(incident)} className="p-2 text-cyan-400">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Hapus kejadian ini?"))
                          remove(incident).catch((cause) =>
                            setError(cause instanceof Error ? cause.message : "Kejadian gagal dihapus"),
                          );
                      }}
                      className="p-2 text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={save} className="panel max-h-[90vh] w-full max-w-xl overflow-auto rounded-xl p-5">
            <div className="mb-5 flex justify-between">
              <div>
                <p className="text-[9px] tracking-widest text-cyan-400">INCIDENT MANAGEMENT</p>
                <h2 className="mt-1 text-lg font-semibold">{edit ? "Edit" : "Tambah"} Kejadian</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Lokasi", "location"],
                ["Kategori", "category"],
                ["Jumlah Personel", "personnel"],
              ].map(([label, key]) => (
                <label key={key} className="text-[10px] text-slate-400">
                  {label}
                  <input
                    required
                    value={String(form[key as keyof typeof form])}
                    type={["personnel", "latitude", "longitude"].includes(key) ? "number" : "text"}
                    step="any"
                    onChange={(event) =>
                      setForm({
                        ...form,
                        [key]: ["personnel", "latitude", "longitude"].includes(key)
                          ? Number(event.target.value)
                          : event.target.value,
                      })
                    }
                    className="mt-2 h-10 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 text-xs text-white outline-none"
                  />
                </label>
              ))}
              <label className="text-[10px] text-slate-400">
                Kodam
                <select
                  required
                  value={form.kodam}
                  onChange={(event) => {
                    const kodam = kodams.find((item) => item.name === event.target.value);
                    setForm({
                      ...form,
                      kodam: event.target.value,
                      latitude: kodam?.latitude ?? form.latitude,
                      longitude: kodam?.longitude ?? form.longitude,
                    });
                  }}
                  className="mt-2 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs"
                >
                  {kodams.map((kodam) => (
                    <option key={kodam.id}>{kodam.name}</option>
                  ))}
                </select>
              </label>
              <div className="rounded-lg border border-cyan-400/15 bg-cyan-400/5 p-3 text-[10px] leading-5 text-slate-400 sm:col-span-2">
                Koordinat marker dan line card otomatis mengikuti pusat lokasi Kodam terpilih:{" "}
                <span className="font-mono text-cyan-300">
                  {kodams.find((item) => item.name === form.kodam)?.latitude ?? form.latitude},{" "}
                  {kodams.find((item) => item.name === form.kodam)?.longitude ?? form.longitude}
                </span>
              </div>
              <label className="text-[10px] text-slate-400">
                Status
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value as Status })}
                  className="mt-2 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs"
                >
                  <option>KONDUSIF</option>
                  <option>WASPADA</option>
                  <option>SIAGA</option>
                </select>
              </label>
              <label className="sm:col-span-2 text-[10px] text-slate-400">
                Kronologi
                <textarea
                  required
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="mt-2 min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950/50 p-3 text-xs text-white outline-none"
                />
              </label>
            </div>
            <button className="mt-5 h-10 w-full rounded-lg bg-cyan-500 text-xs font-bold text-slate-950">
              SIMPAN KEJADIAN
            </button>
          </form>
        </div>
      )}
    </>
  );
}
