"use client";
import { useEffect, useMemo, useState, type ClipboardEvent } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Pencil, Plus, RotateCcw, Save, Search, Trash2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { syncOperationalAnnotations } from "@/lib/map-annotation-storage";
import { parseCoordinatePair } from "@/kodams/coordinates";
type Config = {
  module?: string;
  eyebrow: string;
  title: string;
  description: string;
  stats: { label: string; value: string; icon: LucideIcon }[];
  rows: string[][];
};
type Editor = { index: number | null; row: string[] };
const trend = [
  { name: "Sen", value: 12 },
  { name: "Sel", value: 18 },
  { name: "Rab", value: 14 },
  { name: "Kam", value: 23 },
  { name: "Jum", value: 19 },
  { name: "Sab", value: 28 },
  { name: "Min", value: 21 },
];
const labels: Record<string, string[]> = {
  "Bencana Alam": ["Jenis Bencana", "Lokasi", "Keterangan", "Status"],
  "Kebakaran Hutan & Lahan": ["Wilayah", "Hotspot", "Personel", "Status"],
  "Unjuk Rasa": ["Lokasi", "Waktu", "Organisasi", "Status"],
};
type ApiRecord = {
  id: string;
  primary: string;
  secondary: string;
  detail: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  crowdEstimate: number | null;
  personnel: number | null;
  createdBy: string | null;
  createdAt: string;
};
function recordToRow(record: ApiRecord): string[] {
  return [
    record.primary,
    record.secondary,
    record.detail,
    record.status,
    record.latitude?.toString() ?? "",
    record.longitude?.toString() ?? "",
    record.id,
    record.createdBy ?? "",
    record.createdAt,
    record.crowdEstimate?.toString() ?? "",
    record.personnel?.toString() ?? "",
  ];
}
function rowPayload(row: string[], sortOrder?: number) {
  return {
    primary: row[0],
    secondary: row[1],
    detail: row[2],
    status: row[3],
    latitude: row[4] ? Number(row[4]) : null,
    longitude: row[5] ? Number(row[5]) : null,
    crowdEstimate: row[9] ? Number(row[9]) : null,
    personnel: row[10] ? Number(row[10]) : null,
    sortOrder,
  };
}
export function OperationalPage({ config }: { config: Config }) {
  const [rows, setRows] = useState<string[][]>([]);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const columns = labels[config.title] ?? ["Data Utama", "Nilai", "Keterangan", "Status"];
  const isUnras = config.module === "unras";
  const editorCoordinatesValid =
    !config.module ||
    (!!editor?.row[4] &&
      !!editor?.row[5] &&
      Number.isFinite(Number(editor.row[4])) &&
      Number.isFinite(Number(editor.row[5])) &&
      Number(editor.row[4]) >= -90 &&
      Number(editor.row[4]) <= 90 &&
      Number(editor.row[5]) >= -180 &&
      Number(editor.row[5]) <= 180);
  const editorUnrasMetricsValid =
    !isUnras ||
    (!!editor?.row[9] &&
      !!editor?.row[10] &&
      Number.isInteger(Number(editor.row[9])) &&
      Number(editor.row[9]) >= 0 &&
      Number.isInteger(Number(editor.row[10])) &&
      Number(editor.row[10]) >= 0);
  useEffect(() => {
    if (!config.module) {
      const key = `atlas-monitoring-${config.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const timer = setTimeout(() => {
        try {
          const saved = localStorage.getItem(key);
          const next = saved === null ? config.rows : (JSON.parse(saved) as string[][]);
          setRows(Array.isArray(next) ? next : config.rows);
        } catch {
          setRows(config.rows);
        }
        setBusy(false);
      }, 0);
      return () => clearTimeout(timer);
    }
    let active = true;
    fetch(`/api/monitoring/${config.module}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Data monitoring gagal dimuat");
        if (active) {
          const next = (data as ApiRecord[]).map(recordToRow);
          setRows(next);
          syncOperationalAnnotations(config.title, next);
        }
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Data monitoring gagal dimuat");
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [config.module, config.rows, config.title]);
  function openAdd() {
    setEditor({ index: null, row: ["", "", "", "KONDUSIF", "", "", "", "", "", "", ""] });
  }
  function openEdit(index: number) {
    setEditor({ index, row: [...rows[index]] });
  }
  function pasteCoordinates(event: ClipboardEvent<HTMLInputElement>) {
    if (!editor) return;
    const coordinates = parseCoordinatePair(event.clipboardData.getData("text"));
    if (!coordinates) return;
    event.preventDefault();
    setError("");
    setEditor({
      ...editor,
      row: editor.row.map((value, index) =>
        index === 4 ? String(coordinates.latitude) : index === 5 ? String(coordinates.longitude) : value,
      ),
    });
  }
  async function save() {
    if (!editor || editor.row.some((value, index) => index < 3 && !value.trim())) return;
    setBusy(true);
    setError("");
    if (!config.module) {
      const next =
        editor.index === null
          ? [editor.row, ...rows]
          : rows.map((row, index) => (index === editor.index ? editor.row : row));
      setRows(next);
      localStorage.setItem(
        `atlas-monitoring-${config.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        JSON.stringify(next),
      );
      setEditor(null);
      setBusy(false);
      return;
    }
    try {
      const existingId = editor.index === null ? null : rows[editor.index]?.[6];
      const response = await fetch(
        existingId ? `/api/monitoring/${config.module}/${existingId}` : `/api/monitoring/${config.module}`,
        {
          method: existingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rowPayload(editor.row, editor.index ?? 0)),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Data monitoring gagal disimpan");
      const saved = recordToRow(data as ApiRecord);
      const next =
        editor.index === null
          ? [saved, ...rows]
          : rows.map((row, index) => (index === editor.index ? saved : row));
      setRows(next);
      syncOperationalAnnotations(config.title, next);
      setEditor(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data monitoring gagal disimpan");
    } finally {
      setBusy(false);
    }
  }
  async function remove(index: number) {
    if (!window.confirm("Hapus data monitoring ini?")) return;
    if (!config.module) {
      const next = rows.filter((_, rowIndex) => rowIndex !== index);
      setRows(next);
      localStorage.setItem(
        `atlas-monitoring-${config.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        JSON.stringify(next),
      );
      return;
    }
    const id = rows[index]?.[6];
    if (!id) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/monitoring/${config.module}/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Data monitoring gagal dihapus");
      const next = rows.filter((_, rowIndex) => rowIndex !== index);
      setRows(next);
      syncOperationalAnnotations(config.title, next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data monitoring gagal dihapus");
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    if (window.confirm("Kembalikan seluruh data monitoring ke data awal?")) {
      if (!config.module) {
        setRows(config.rows);
        localStorage.setItem(
          `atlas-monitoring-${config.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          JSON.stringify(config.rows),
        );
        setQuery("");
        return;
      }
      setBusy(true);
      setError("");
      try {
        const response = await fetch(`/api/monitoring/${config.module}/reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: config.rows.map((row, sortOrder) => rowPayload(row, sortOrder)) }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Data awal gagal dipulihkan");
        const next = (data as ApiRecord[]).map(recordToRow);
        setRows(next);
        syncOperationalAnnotations(config.title, next);
        setQuery("");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Data awal gagal dipulihkan");
      } finally {
        setBusy(false);
      }
    }
  }
  const filtered = useMemo(
    () =>
      rows
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => row.join(" ").toLowerCase().includes(query.toLowerCase())),
    [rows, query],
  );
  return (
    <AppShell>
      <div className="mx-auto max-w-[1800px] space-y-5">
        <PageHeader
          eyebrow={config.eyebrow}
          title={config.title}
          description={config.description}
          action={
            <button
              onClick={openAdd}
              className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950"
            >
              <Plus size={14} />
              Tambah Data
            </button>
          }
        />
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300"
          >
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {config.stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="panel rounded-xl p-4">
              <div className="flex items-center justify-between">
                <Icon size={18} className="text-cyan-400" />
                <span className="text-[9px] text-emerald-400">LIVE</span>
              </div>
              <p className="mt-5 text-2xl font-semibold">{value}</p>
              <p className="mt-1 text-[11px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
          <section className="panel overflow-hidden rounded-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 p-4">
              <h2 className="text-xs font-semibold tracking-[.12em]">DATA OPERASIONAL</h2>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3">
                  <Search size={13} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari data..."
                    className="h-8 bg-transparent text-[10px] outline-none"
                  />
                </label>
                <button
                  onClick={reset}
                  disabled={busy}
                  title="Reset data awal"
                  className="rounded-lg border border-slate-800 p-2 text-slate-500 hover:text-white"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table
                className={`w-full text-left text-[11px] ${isUnras ? "min-w-[900px]" : "min-w-[680px]"}`}
              >
                <thead>
                  <tr className="border-b border-slate-800 text-[9px] text-slate-500">
                    {columns.slice(0, 3).map((column) => (
                      <th key={column} className="px-4 py-3 first:pl-4">
                        {column.toUpperCase()}
                      </th>
                    ))}
                    {isUnras && (
                      <>
                        <th className="px-4 py-3">ESTIMASI MASSA</th>
                        <th className="px-4 py-3">PERSONEL PENGAMANAN</th>
                      </>
                    )}
                    <th className="px-4 py-3">{columns[3].toUpperCase()}</th>
                    <th className="px-4 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(({ row, index }) => (
                    <tr
                      key={`${index}-${row[0]}`}
                      className="border-b border-slate-800/70 hover:bg-white/[.02]"
                    >
                      <td className="px-4 py-4 font-medium">{row[0]}</td>
                      <td className="px-4 text-cyan-400">{row[1]}</td>
                      <td className="px-4 text-slate-400">{row[2]}</td>
                      {isUnras && (
                        <>
                          <td className="px-4 text-slate-300">
                            {row[9] ? `${Number(row[9]).toLocaleString("id-ID")} orang` : "—"}
                          </td>
                          <td className="px-4 text-slate-300">
                            {row[10] ? `${Number(row[10]).toLocaleString("id-ID")} orang` : "—"}
                          </td>
                        </>
                      )}
                      <td className="px-4">
                        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[9px] text-amber-300">
                          {row[3]}
                        </span>
                      </td>
                      <td className="px-4 text-right">
                        <button
                          onClick={() => openEdit(index)}
                          className="p-2 text-cyan-400"
                          aria-label="Edit data"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => remove(index)}
                          className="p-2 text-rose-400"
                          aria-label="Hapus data"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="p-8 text-center text-xs text-slate-500">Tidak ada data monitoring.</p>
              )}
            </div>
          </section>
          <section className="panel rounded-xl">
            <div className="border-b border-slate-800 p-4 text-xs font-semibold tracking-[.12em]">
              TREN 7 HARI
            </div>
            <div className="h-[270px] p-4">
              <ResponsiveContainer>
                <BarChart data={trend}>
                  <CartesianGrid stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0c1728", border: "1px solid #263950", fontSize: 10 }}
                  />
                  <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>
      {editor && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/75 p-4">
          <section className="panel w-full max-w-lg rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-bold tracking-widest text-cyan-400">{config.eyebrow}</p>
                <h2 className="mt-1 text-lg font-semibold">
                  {editor.index === null ? "Tambah" : "Edit"} Data {config.title}
                </h2>
              </div>
              <button onClick={() => setEditor(null)} className="text-slate-500">
                <X size={19} />
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {columns.map((column, index) => (
                <label key={column} className="text-[10px] text-slate-400">
                  {column}
                  {index === 3 ? (
                    <select
                      value={editor.row[index]}
                      onChange={(e) =>
                        setEditor({
                          ...editor,
                          row: editor.row.map((value, i) => (i === index ? e.target.value : value)),
                        })
                      }
                      className="input-map"
                    >
                      <option>KONDUSIF</option>
                      <option>TERPANTAU</option>
                      <option>WASPADA</option>
                      <option>SIAGA</option>
                      <option>DARURAT</option>
                      <option>SELESAI</option>
                    </select>
                  ) : (
                    <input
                      value={editor.row[index]}
                      onChange={(e) =>
                        setEditor({
                          ...editor,
                          row: editor.row.map((value, i) => (i === index ? e.target.value : value)),
                        })
                      }
                      className="input-map"
                    />
                  )}
                </label>
              ))}
              {config.module && (
                <>
                  <label className="text-[10px] text-slate-400">
                    Latitude
                    <input
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      required
                      value={editor.row[4] ?? ""}
                      onChange={(e) =>
                        setEditor({
                          ...editor,
                          row: editor.row.map((value, i) => (i === 4 ? e.target.value : value)),
                        })
                      }
                      onPaste={pasteCoordinates}
                      placeholder="Contoh: 0.510000"
                      className="input-map"
                    />
                  </label>
                  <label className="text-[10px] text-slate-400">
                    Longitude
                    <input
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      required
                      value={editor.row[5] ?? ""}
                      onChange={(e) =>
                        setEditor({
                          ...editor,
                          row: editor.row.map((value, i) => (i === 5 ? e.target.value : value)),
                        })
                      }
                      onPaste={pasteCoordinates}
                      placeholder="Contoh: 101.450000"
                      className="input-map"
                    />
                  </label>
                  <p className="text-[9px] leading-4 text-slate-500 sm:col-span-2">
                    Paste format latitude, longitude ke salah satu kolom untuk mengisi keduanya otomatis.
                  </p>
                </>
              )}
              {isUnras && (
                <>
                  <label className="text-[10px] text-slate-400">
                    Estimasi Massa
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={editor.row[9] ?? ""}
                      onChange={(e) =>
                        setEditor({
                          ...editor,
                          row: editor.row.map((value, i) => (i === 9 ? e.target.value : value)),
                        })
                      }
                      placeholder="Contoh: 1200"
                      className="input-map"
                    />
                  </label>
                  <label className="text-[10px] text-slate-400">
                    Personel Pengamanan
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={editor.row[10] ?? ""}
                      onChange={(e) =>
                        setEditor({
                          ...editor,
                          row: editor.row.map((value, i) => (i === 10 ? e.target.value : value)),
                        })
                      }
                      placeholder="Contoh: 360"
                      className="input-map"
                    />
                  </label>
                </>
              )}
            </div>
            <button
              onClick={save}
              disabled={
                busy ||
                !editorCoordinatesValid ||
                !editorUnrasMetricsValid ||
                editor.row.slice(0, 3).some((value) => !value.trim())
              }
              className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 text-xs font-bold text-slate-950 disabled:opacity-40"
            >
              <Save size={14} />
              Simpan Data
            </button>
          </section>
        </div>
      )}
    </AppShell>
  );
}
