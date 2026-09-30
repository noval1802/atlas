"use client";

import { useMemo, useState, type FormEvent } from "react";
import { PackagePlus, Pencil, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

type KodamOption = { code: string; name: string };
type ResourceRow = {
  id: string;
  kodamId: string;
  kodam: KodamOption & { id?: string };
  type: string;
  name: string;
  quantity: number;
  deployed: number;
  status: string;
};

const empty = { kodamCode: "", type: "PERSONEL", name: "", quantity: 0, deployed: 0, status: "SIAP" };

export function ResourceManager({
  initialRows,
  kodams,
  canWrite,
}: {
  initialRows: ResourceRow[];
  kodams: KodamOption[];
  canWrite: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState({ ...empty, kodamCode: kodams[0]?.code ?? "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const totals = useMemo(
    () =>
      rows.reduce(
        (value, row) => ({
          quantity: value.quantity + row.quantity,
          deployed: value.deployed + row.deployed,
        }),
        { quantity: 0, deployed: 0 },
      ),
    [rows],
  );

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(editing ? `/api/resources/${editing}` : "/api/resources", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Sumber daya gagal disimpan");
      setRows((current) =>
        editing ? current.map((row) => (row.id === editing ? data : row)) : [...current, data],
      );
      setEditing(null);
      setForm({ ...empty, kodamCode: kodams[0]?.code ?? "" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sumber daya gagal disimpan");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Hapus data sumber daya ini?")) return;
    const response = await fetch(`/api/resources/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) return setError(data.error ?? "Sumber daya gagal dihapus");
    setRows((current) => current.filter((row) => row.id !== id));
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <PageHeader
        eyebrow="KESIAPAN OPERASIONAL"
        title="Personel & Alut"
        description="Data sumber daya bersama berbasis PostgreSQL dan cakupan Kodam"
      />
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Total Kekuatan", totals.quantity],
          ["Dikerahkan", totals.deployed],
          ["Unit Data", rows.length],
        ].map(([label, value]) => (
          <div key={String(label)} className="panel rounded-xl p-4">
            <Users size={17} className="text-cyan-400" />
            <p className="mt-3 text-2xl font-semibold">{Number(value).toLocaleString("id-ID")}</p>
            <p className="text-[10px] text-slate-500">{label}</p>
          </div>
        ))}
      </section>
      {canWrite && (
        <form onSubmit={save} className="panel grid gap-3 rounded-xl p-4 md:grid-cols-3 xl:grid-cols-7">
          <select
            required
            value={form.kodamCode}
            onChange={(event) => setForm({ ...form, kodamCode: event.target.value })}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
          >
            {kodams.map((kodam) => (
              <option key={kodam.code} value={kodam.code}>
                {kodam.name}
              </option>
            ))}
          </select>
          <select
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value })}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
          >
            <option>PERSONEL</option>
            <option>ALUT</option>
            <option>KENDARAAN</option>
            <option>LOGISTIK</option>
          </select>
          <input
            required
            placeholder="Nama satuan/alut"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
          />
          <input
            type="number"
            min="0"
            placeholder="Jumlah"
            value={form.quantity}
            onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
          />
          <input
            type="number"
            min="0"
            placeholder="Dikerahkan"
            value={form.deployed}
            onChange={(event) => setForm({ ...form, deployed: Number(event.target.value) })}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
          />
          <select
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
          >
            <option>SIAP</option>
            <option>OPERASI</option>
            <option>PERAWATAN</option>
            <option>TIDAK_SIAP</option>
          </select>
          <button
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950"
          >
            <PackagePlus size={14} />
            {editing ? "Simpan" : "Tambah"}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      )}
      <div className="panel overflow-x-auto rounded-xl">
        <table className="w-full min-w-[800px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-slate-800 text-[9px] text-slate-500">
              <th className="px-4 py-3">KODAM</th>
              <th>TIPE</th>
              <th>NAMA</th>
              <th>JUMLAH</th>
              <th>DIKERAHKAN</th>
              <th>STATUS</th>
              <th className="pr-4 text-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-800/70">
                <td className="px-4 py-3">{row.kodam.name}</td>
                <td>{row.type}</td>
                <td>{row.name}</td>
                <td>{row.quantity.toLocaleString("id-ID")}</td>
                <td>{row.deployed.toLocaleString("id-ID")}</td>
                <td>{row.status}</td>
                <td className="pr-4 text-right">
                  {canWrite && (
                    <>
                      <button
                        aria-label="Edit"
                        onClick={() => {
                          setEditing(row.id);
                          setForm({
                            kodamCode: row.kodam.code,
                            type: row.type,
                            name: row.name,
                            quantity: row.quantity,
                            deployed: row.deployed,
                            status: row.status,
                          });
                        }}
                        className="p-2 text-cyan-400"
                      >
                        <Pencil size={14} />
                      </button>
                      <button aria-label="Hapus" onClick={() => remove(row.id)} className="p-2 text-rose-400">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-8 text-center text-xs text-slate-500">Belum ada data sumber daya.</p>
        )}
      </div>
    </div>
  );
}
