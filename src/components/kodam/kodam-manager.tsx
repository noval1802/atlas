"use client";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Pencil, Plus, RotateCcw, Save, Search, Trash2, Users, X } from "lucide-react";
import { useEffect, useState, type ClipboardEvent } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { type KodamData } from "@/data/kodam";
import { fetchKodams, mapApiKodam, notifyKodamsUpdated } from "@/kodams/client";
import { parseCoordinatePair } from "@/kodams/coordinates";
import { prepareKodamLogo, uploadKodamLogo } from "@/kodams/logo-client";

type KotamaopsDraft = {
  name: string;
  code: string;
  region: string;
  location: string;
  latitude: string;
  longitude: string;
  status: KodamData["status"];
  personnel: number;
  deployed: number;
};

function emptyKotamaopsDraft(): KotamaopsDraft {
  return {
    name: "",
    code: "",
    region: "",
    location: "",
    latitude: "",
    longitude: "",
    status: "KONDUSIF",
    personnel: 0,
    deployed: 0,
  };
}

export function KodamManager({
  canCreate,
  canDelete,
  canReset,
}: {
  canCreate: boolean;
  canDelete: boolean;
  canReset: boolean;
}) {
  const [rows, setRows] = useState<KodamData[]>([]);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<KodamData | null>(null);
  const [newKotamaops, setNewKotamaops] = useState<KotamaopsDraft | null>(null);
  const [newLogo, setNewLogo] = useState<File | null>(null);
  const [editLogo, setEditLogo] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    let active = true;
    fetchKodams()
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Data Kodam gagal dimuat");
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function createKotamaops() {
    if (!newKotamaops) return;
    const coordinates = parseCoordinatePair(`${newKotamaops.latitude},${newKotamaops.longitude}`);
    if (!coordinates) {
      setError("Koordinat harus menggunakan format latitude, longitude yang valid");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/kodams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKotamaops.name,
          code: newKotamaops.code,
          region: newKotamaops.region,
          location: newKotamaops.location,
          status: newKotamaops.status,
          personnel: newKotamaops.personnel,
          deployed: newKotamaops.deployed,
          ...coordinates,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Kotamaops gagal ditambahkan");
      let saved = mapApiKodam(data);
      if (newLogo) {
        try {
          saved = mapApiKodam(await uploadKodamLogo(saved.id, newLogo));
        } catch (logoError) {
          setRows((current) => [...current, saved].sort((a, b) => a.name.localeCompare(b.name, "id-ID")));
          notifyKodamsUpdated();
          setNewKotamaops(null);
          setNewLogo(null);
          setError(
            `Kotamaops tersimpan, tetapi ${logoError instanceof Error ? logoError.message : "logo gagal diunggah"}`,
          );
          return;
        }
      }
      setRows((current) => [...current, saved].sort((a, b) => a.name.localeCompare(b.name, "id-ID")));
      notifyKodamsUpdated();
      setNewKotamaops(null);
      setNewLogo(null);
      setNotice(`${saved.name} berhasil ditambahkan.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kotamaops gagal ditambahkan");
    } finally {
      setBusy(false);
    }
  }
  function pasteCoordinates(event: ClipboardEvent<HTMLInputElement>) {
    if (!newKotamaops) return;
    const coordinates = parseCoordinatePair(event.clipboardData.getData("text"));
    if (!coordinates) return;
    event.preventDefault();
    setError("");
    setNewKotamaops({
      ...newKotamaops,
      latitude: String(coordinates.latitude),
      longitude: String(coordinates.longitude),
    });
  }
  function pasteEditCoordinates(event: ClipboardEvent<HTMLInputElement>) {
    if (!edit) return;
    const coordinates = parseCoordinatePair(event.clipboardData.getData("text"));
    if (!coordinates) return;
    event.preventDefault();
    setError("");
    setEdit({ ...edit, ...coordinates });
  }
  async function update() {
    if (!edit) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/kodams/${edit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: edit.name,
          code: edit.code,
          region: edit.region,
          location: edit.location,
          latitude: edit.latitude,
          longitude: edit.longitude,
          status: edit.status,
          personnel: edit.personnel,
          incidentCount: edit.incidents,
          deployed: edit.deployed,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Data Kodam gagal disimpan");
      let saved = mapApiKodam(data);
      if (editLogo) {
        try {
          saved = mapApiKodam(await uploadKodamLogo(saved.id, editLogo));
        } catch (logoError) {
          setRows((current) => current.map((kodam) => (kodam.id === edit.id ? saved : kodam)));
          notifyKodamsUpdated();
          setEdit(null);
          setEditLogo(null);
          setError(
            `Data tersimpan, tetapi ${logoError instanceof Error ? logoError.message : "logo gagal diunggah"}`,
          );
          return;
        }
      }
      setRows((current) => current.map((kodam) => (kodam.id === edit.id ? saved : kodam)));
      notifyKodamsUpdated();
      setEdit(null);
      setEditLogo(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data Kodam gagal disimpan");
    } finally {
      setBusy(false);
    }
  }
  async function remove(kotamaops: KodamData) {
    if (!window.confirm(`Hapus ${kotamaops.name}? Tindakan ini tidak dapat dibatalkan.`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/kodams/${kotamaops.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Kotamaops gagal dihapus");
      setRows((current) => current.filter((row) => row.id !== kotamaops.id));
      setEdit((current) => (current?.id === kotamaops.id ? null : current));
      notifyKodamsUpdated();
      setNotice(`${kotamaops.name} berhasil dihapus.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kotamaops gagal dihapus");
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    if (!window.confirm("Kembalikan seluruh data Kotamaops bawaan ke data awal?")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/kodams/reset", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Data Kodam gagal direset");
      setRows((data as Parameters<typeof mapApiKodam>[0][]).map(mapApiKodam));
      notifyKodamsUpdated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data Kodam gagal direset");
    } finally {
      setBusy(false);
    }
  }
  const filtered = rows.filter((k) =>
    `${k.name} ${k.code} ${k.region} ${k.location}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <div className="flex flex-wrap justify-between gap-3">
        <label className="panel flex min-w-64 max-w-md flex-1 items-center gap-2 rounded-lg px-3">
          <Search size={14} className="text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari Kotamaops atau wilayah..."
            className="h-10 w-full bg-transparent text-xs outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {canCreate && (
            <button
              onClick={() => {
                setError("");
                setNotice("");
                setNewLogo(null);
                setNewKotamaops(emptyKotamaopsDraft());
              }}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-[10px] font-bold tracking-wide text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              <Plus size={14} />
              Tambah Kotamaops
            </button>
          )}
          {canReset && (
            <button
              onClick={reset}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-[10px] text-slate-400 hover:text-white"
            >
              <RotateCcw size={13} />
              Reset data awal
            </button>
          )}
        </div>
      </div>
      {notice && (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-300">
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300"
        >
          {error}
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((k) => (
          <article
            key={k.id}
            className="panel rounded-xl p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/30"
          >
            <div className="mb-3 flex h-20 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/30">
              <div className="relative h-16 w-16">
                <Image
                  src={k.logo}
                  alt={`Logo ${k.name}`}
                  fill
                  sizes="64px"
                  className="object-contain"
                  unoptimized={k.logo.startsWith("/api/")}
                />
              </div>
            </div>
            <div className="flex items-start justify-between">
              <Link
                href={`/kodam/${k.id}`}
                className="rounded-lg bg-cyan-400/10 px-3 py-2 font-mono text-xs font-bold text-cyan-300"
              >
                {k.code}
              </Link>
              <div className="flex items-center gap-2">
                <StatusBadge status={k.status} />
                <button
                  onClick={() => {
                    setEditLogo(null);
                    setEdit({ ...k });
                  }}
                  disabled={busy}
                  className="rounded-md p-2 text-slate-500 hover:bg-cyan-400/10 hover:text-cyan-300"
                  aria-label={`Edit ${k.name}`}
                >
                  <Pencil size={14} />
                </button>
                {canDelete && (
                  <button
                    onClick={() => remove(k)}
                    disabled={busy}
                    className="rounded-md p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
                    aria-label={`Hapus ${k.name}`}
                    title={`Hapus ${k.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            <Link href={`/kodam/${k.id}`}>
              <h2 className="mt-4 text-sm font-semibold">{k.name}</h2>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                <MapPin size={11} />
                {k.location} • {k.region}
              </p>
              <p className="mt-2 font-mono text-[9px] text-slate-600">
                {k.latitude}, {k.longitude}
              </p>
              <div className="mt-4 grid grid-cols-2 border-t border-slate-800 pt-3 text-[10px]">
                <span className="text-slate-500">
                  Kejadian <b className="ml-1 text-slate-200">{k.incidents}</b>
                </span>
                <span className="flex justify-end gap-1 text-slate-500">
                  <Users size={12} />
                  <b className="text-slate-200">{k.personnel.toLocaleString("id-ID")}</b>
                </span>
              </div>
            </Link>
          </article>
        ))}
      </div>
      {newKotamaops && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4">
          <div className="panel max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-bold tracking-widest text-cyan-400">TAMBAH KOTAMAOPS</p>
                <h2 className="mt-1 text-lg font-semibold">Data Satuan Baru</h2>
              </div>
              <button onClick={() => setNewKotamaops(null)} className="text-slate-500" aria-label="Tutup">
                <X size={19} />
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <LogoPicker
                currentLogo="/kodam/default-kotamaops.svg"
                onChange={setNewLogo}
                onError={setError}
              />
              <EditField
                label="Nama Kotamaops"
                value={newKotamaops.name}
                onChange={(value) => setNewKotamaops({ ...newKotamaops, name: value })}
              />
              <EditField
                label="Kode unik"
                value={newKotamaops.code}
                onChange={(value) => setNewKotamaops({ ...newKotamaops, code: value.toUpperCase() })}
              />
              <EditField
                label="Wilayah / Cakupan"
                value={newKotamaops.region}
                onChange={(value) => setNewKotamaops({ ...newKotamaops, region: value })}
              />
              <EditField
                label="Lokasi Markas"
                value={newKotamaops.location}
                onChange={(value) => setNewKotamaops({ ...newKotamaops, location: value })}
              />
              <EditField
                label="Latitude"
                value={newKotamaops.latitude}
                type="number"
                placeholder="-5.966408"
                onChange={(value) => setNewKotamaops({ ...newKotamaops, latitude: value })}
                onPaste={pasteCoordinates}
              />
              <EditField
                label="Longitude"
                value={newKotamaops.longitude}
                type="number"
                placeholder="107.314146"
                onChange={(value) => setNewKotamaops({ ...newKotamaops, longitude: value })}
                onPaste={pasteCoordinates}
              />
              <p className="text-[9px] leading-4 text-slate-500 sm:col-span-2">
                Anda dapat paste format latitude, longitude ke salah satu kolom untuk mengisi keduanya
                otomatis. Contoh: -5.966408, 107.314146
              </p>
              <label className="text-[10px] text-slate-400">
                Status
                <select
                  value={newKotamaops.status}
                  onChange={(event) =>
                    setNewKotamaops({
                      ...newKotamaops,
                      status: event.target.value as KodamData["status"],
                    })
                  }
                  className="input-map"
                >
                  <option>KONDUSIF</option>
                  <option>WASPADA</option>
                  <option>SIAGA</option>
                </select>
              </label>
              <EditField
                label="Jumlah Personel"
                value={String(newKotamaops.personnel)}
                type="number"
                onChange={(value) => setNewKotamaops({ ...newKotamaops, personnel: Number(value) })}
              />
              <EditField
                label="Personel Dikerahkan"
                value={String(newKotamaops.deployed)}
                type="number"
                onChange={(value) => setNewKotamaops({ ...newKotamaops, deployed: Number(value) })}
              />
            </div>
            <div className="mt-4 rounded-lg border border-cyan-400/15 bg-cyan-400/5 p-3 text-[10px] leading-5 text-slate-400">
              <MapPin size={13} className="mr-1 inline text-cyan-400" />
              Setelah disimpan, Kotamaops otomatis muncul pada daftar, detail satuan, Dashboard, dan Peta
              Situasi. Logo unggahan digunakan pada kartu, detail, Dashboard, dan marker peta.
            </div>
            <button
              onClick={createKotamaops}
              disabled={
                busy ||
                !newKotamaops.name.trim() ||
                !newKotamaops.code.trim() ||
                !newKotamaops.region.trim() ||
                !newKotamaops.location.trim() ||
                !parseCoordinatePair(`${newKotamaops.latitude},${newKotamaops.longitude}`)
              }
              className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save size={14} />
              {busy ? "MENYIMPAN..." : "SIMPAN KOTAMAOPS"}
            </button>
          </div>
        </div>
      )}
      {edit && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4">
          <div className="panel max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-bold tracking-widest text-cyan-400">EDIT DATA KOTAMAOPS</p>
                <h2 className="mt-1 text-lg font-semibold">{edit.name}</h2>
              </div>
              <button onClick={() => setEdit(null)} className="text-slate-500">
                <X size={19} />
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <LogoPicker currentLogo={edit.logo} onChange={setEditLogo} onError={setError} />
              <EditField
                label="Nama Kotamaops"
                value={edit.name}
                onChange={(v) => setEdit({ ...edit, name: v })}
              />
              <EditField label="Kode" value={edit.code} onChange={(v) => setEdit({ ...edit, code: v })} />
              <EditField
                label="Wilayah"
                value={edit.region}
                onChange={(v) => setEdit({ ...edit, region: v })}
              />
              <EditField
                label="Lokasi"
                value={edit.location}
                onChange={(v) => setEdit({ ...edit, location: v })}
              />
              <EditField
                label="Latitude"
                value={String(edit.latitude)}
                type="number"
                onChange={(v) => setEdit({ ...edit, latitude: Number(v) })}
                onPaste={pasteEditCoordinates}
              />
              <EditField
                label="Longitude"
                value={String(edit.longitude)}
                type="number"
                onChange={(v) => setEdit({ ...edit, longitude: Number(v) })}
                onPaste={pasteEditCoordinates}
              />
              <p className="text-[9px] leading-4 text-slate-500 sm:col-span-2">
                Paste format latitude, longitude ke salah satu kolom untuk mengisi keduanya otomatis.
              </p>
              <label className="text-[10px] text-slate-400">
                Status
                <select
                  value={edit.status}
                  onChange={(e) => setEdit({ ...edit, status: e.target.value as KodamData["status"] })}
                  className="input-map"
                >
                  <option>KONDUSIF</option>
                  <option>WASPADA</option>
                  <option>SIAGA</option>
                </select>
              </label>
              <EditField
                label="Jumlah Personel"
                value={String(edit.personnel)}
                type="number"
                onChange={(v) => setEdit({ ...edit, personnel: Number(v) })}
              />
            </div>
            <div className="mt-4 rounded-lg border border-cyan-400/15 bg-cyan-400/5 p-3 text-[10px] leading-5 text-slate-400">
              <MapPin size={13} className="mr-1 inline text-cyan-400" />
              Koordinat latitude dan longitude menentukan posisi marker Kotamaops pada Dashboard dan Peta
              Situasi.
            </div>
            <button
              onClick={update}
              disabled={busy}
              className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 text-xs font-bold text-slate-950"
            >
              <Save size={14} />
              SIMPAN PERUBAHAN
            </button>
          </div>
        </div>
      )}
    </>
  );
}
function LogoPicker({
  currentLogo,
  onChange,
  onError,
}: {
  currentLogo: string;
  onChange: (file: File | null) => void;
  onError: (message: string) => void;
}) {
  const [preview, setPreview] = useState(currentLogo);
  useEffect(
    () => () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  async function selectLogo(file: File | undefined) {
    if (!file) return;
    try {
      const prepared = await prepareKodamLogo(file);
      const nextPreview = URL.createObjectURL(prepared);
      setPreview(nextPreview);
      onChange(prepared);
      onError("");
    } catch (cause) {
      onChange(null);
      onError(cause instanceof Error ? cause.message : "Logo tidak dapat diproses");
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-4 sm:col-span-2">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/60">
          <Image src={preview} alt="Preview logo Kotamaops" fill className="object-contain p-2" unoptimized />
        </div>
        <label className="min-w-0 flex-1 text-[10px] text-slate-400">
          Logo Kotamaops
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => void selectLogo(event.target.files?.[0])}
            className="mt-2 block w-full text-[10px] text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-2 file:text-[9px] file:font-bold file:text-slate-950"
          />
          <span className="mt-2 block text-[9px] leading-4 text-slate-500">
            PNG, JPEG, atau WebP • maksimal 2 MB • otomatis diproses menjadi WebP maksimal 512×512.
          </span>
        </label>
      </div>
    </div>
  );
}
function EditField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  onPaste,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  onPaste?: (event: ClipboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="text-[10px] text-slate-400">
      {label}
      <input
        required
        type={type}
        step={type === "number" ? "any" : undefined}
        value={value}
        placeholder={placeholder}
        onPaste={onPaste}
        onChange={(e) => onChange(e.target.value)}
        className="input-map"
      />
    </label>
  );
}
