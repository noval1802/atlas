"use client";
import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { MapPin, MousePointer2, Save, Trash2, X } from "lucide-react";
import { incidents } from "@/data/dashboard";
import { kodams } from "@/data/kodam";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Status } from "@/types";
import { KodamMarkers } from "./kodam-markers";
import { AnnotationLayer } from "./annotation-layer";
import { useMapAnnotations } from "@/hooks/use-map-annotations";
import { MAP_TILE_ATTRIBUTION, MAP_TILE_CLASS_NAME, MAP_TILE_URL } from "@/lib/map-tiles";
import { realtimeBrowserEvent, type RealtimeInvalidation } from "@/lib/realtime-events";
import { fetchKodams } from "@/kodams/client";
interface MapPoint {
  id: string;
  title: string;
  kodam: string;
  location: string;
  category: string;
  description: string;
  status: Status;
  personnel: number;
  latitude: number;
  longitude: number;
  createdAt: string;
}
const colors: Record<Status, string> = { KONDUSIF: "#34d399", WASPADA: "#fbbf24", SIAGA: "#fb7185" };
function MapClick({ active, onPick }: { active: boolean; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (active) onPick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}
export default function EditableSituationMap() {
  const annotations = useMapAnnotations();
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(null);
  const [custom, setCustom] = useState<MapPoint[]>([]);
  const [kotamaops, setKotamaops] = useState(kodams);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    kodam: kodams[0].name,
    location: "",
    category: "Bencana Alam",
    description: "",
    status: "WASPADA" as Status,
    personnel: 0,
  });
  useEffect(() => {
    let active = true;
    const load = () => {
      void fetch("/api/map-points")
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? "Titik peta gagal dimuat");
          if (active) setCustom(data as MapPoint[]);
        })
        .catch((cause) => {
          if (active) setError(cause instanceof Error ? cause.message : "Titik peta gagal dimuat");
        });
    };
    const onRealtime = (event: Event) => {
      const detail = (event as CustomEvent<RealtimeInvalidation>).detail;
      if (detail.resource === "map-points") load();
    };
    load();
    window.addEventListener(realtimeBrowserEvent, onRealtime);
    return () => {
      active = false;
      window.removeEventListener(realtimeBrowserEvent, onRealtime);
    };
  }, []);
  useEffect(() => {
    const refresh = () => {
      void fetchKodams()
        .then(setKotamaops)
        .catch(() => undefined);
    };
    refresh();
    window.addEventListener("atlas:kodams-updated", refresh);
    return () => window.removeEventListener("atlas:kodams-updated", refresh);
  }, []);
  function pick(lat: number, lng: number) {
    setSelected({ lat, lng });
    setAdding(false);
  }
  function cancel() {
    setAdding(false);
    setSelected(null);
  }
  async function save() {
    if (!selected || !form.title.trim() || !form.location.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/map-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, latitude: selected.lat, longitude: selected.lng }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Titik peta gagal disimpan");
      setCustom((current) => [data as MapPoint, ...current]);
      setSelected(null);
      setForm({
        title: "",
        kodam: kodams[0].name,
        location: "",
        category: "Bencana Alam",
        description: "",
        status: "WASPADA",
        personnel: 0,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Titik peta gagal disimpan");
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    if (!window.confirm("Hapus titik operator ini?")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/map-points/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Titik peta gagal dihapus");
      setCustom((current) => current.filter((point) => point.id !== id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Titik peta gagal dihapus");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="relative">
      <MapContainer
        center={[-2.4, 118]}
        zoom={5}
        minZoom={4}
        maxZoom={14}
        scrollWheelZoom
        className={`h-[calc(100vh-220px)] min-h-[520px] w-full ${adding ? "cursor-crosshair" : ""}`}
      >
        <TileLayer
          attribution={MAP_TILE_ATTRIBUTION}
          className={MAP_TILE_CLASS_NAME}
          crossOrigin
          url={MAP_TILE_URL}
        />
        <KodamMarkers />
        <AnnotationLayer items={annotations} />
        <MapClick active={adding} onPick={pick} />
        {incidents.slice(0, 0).map((item) => (
          <CircleMarker
            key={item.id}
            center={[item.latitude, item.longitude]}
            radius={7}
            pathOptions={{
              color: colors[item.status],
              fillColor: colors[item.status],
              fillOpacity: 0.72,
              weight: 2,
            }}
          >
            <Popup className="atlas-popup">
              <p className="text-[10px] text-cyan-400">{item.id}</p>
              <p className="mt-1 text-sm font-semibold">
                {item.category} • {item.location}
              </p>
              <p className="mt-2 text-[10px] text-slate-400">{item.description}</p>
              <div className="mt-3">
                <StatusBadge status={item.status} />
              </div>
            </Popup>
          </CircleMarker>
        ))}
        {custom.map((item) => (
          <CircleMarker
            key={item.id}
            center={[item.latitude, item.longitude]}
            radius={9}
            pathOptions={{
              color: colors[item.status],
              fillColor: colors[item.status],
              fillOpacity: 0.85,
              weight: 3,
              dashArray: "3 2",
            }}
          >
            <Popup className="atlas-popup">
              <div className="min-w-52">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold tracking-wider text-cyan-400">TITIK OPERATOR</p>
                    <p className="mt-1 text-sm font-semibold">{item.title}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-2 text-[10px] text-slate-400">
                  {item.kodam} • {item.location}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {item.category} • {item.personnel} personel
                </p>
                {item.description && (
                  <p className="mt-3 border-t border-slate-700 pt-2 text-[10px] text-slate-400">
                    {item.description}
                  </p>
                )}
                <p className="mt-2 font-mono text-[9px] text-slate-600">
                  {item.latitude}, {item.longitude}
                </p>
                <button
                  onClick={() => remove(item.id)}
                  className="mt-3 flex items-center gap-1 text-[10px] text-rose-400"
                >
                  <Trash2 size={12} />
                  Hapus titik
                </button>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="absolute left-3 top-3 z-[500] flex flex-col gap-2">
        <button
          onClick={() => {
            setAdding(!adding);
            setSelected(null);
          }}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-semibold shadow-xl backdrop-blur ${adding ? "border-amber-400 bg-amber-400 text-slate-950" : "border-cyan-400/30 bg-[#0b1424]/95 text-cyan-300"}`}
        >
          {adding ? <MousePointer2 size={15} /> : <MapPin size={15} />}{" "}
          {adding ? "KLIK LOKASI DI PETA" : "TAMBAH TITIK"}
        </button>
        {adding && (
          <div className="rounded-lg border border-amber-400/20 bg-[#0b1424]/95 p-3 text-[10px] text-slate-300 shadow-xl">
            Geser atau zoom, lalu klik lokasi yang diinginkan.
          </div>
        )}
        {error && (
          <p className="max-w-xs rounded-lg border border-rose-500/30 bg-[#0b1424]/95 p-3 text-[10px] text-rose-300">
            {error}
          </p>
        )}
      </div>
      {selected && (
        <div className="absolute bottom-3 right-3 top-3 z-[600] w-[calc(100%-24px)] max-w-sm overflow-y-auto rounded-xl border border-slate-700 bg-[#08111f]/98 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold tracking-widest text-cyan-400">TITIK BARU</p>
              <h3 className="mt-1 text-base font-semibold">Detail Lokasi</h3>
              <p className="mt-1 font-mono text-[9px] text-slate-500">
                {selected.lat}, {selected.lng}
              </p>
            </div>
            <button onClick={cancel} className="text-slate-500">
              <X size={18} />
            </button>
          </div>
          <div className="mt-4 space-y-3">
            <Field label="Judul titik *">
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Contoh: Banjir Kecamatan A"
                className="input-map"
              />
            </Field>
            <Field label="Kotamaops">
              <select
                value={form.kodam}
                onChange={(e) => setForm({ ...form, kodam: e.target.value })}
                className="input-map"
              >
                {kotamaops.map((k) => (
                  <option key={k.id}>{k.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Lokasi *">
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Kabupaten / Kota"
                className="input-map"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Kategori">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-map"
                >
                  <option>Lokasi Kodam</option>
                  <option>Bencana Alam</option>
                  <option>Karhutla</option>
                  <option>Unras</option>
                  <option>Gangguan Keamanan</option>
                  <option>Lainnya</option>
                </select>
              </Field>
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                  className="input-map"
                >
                  <option>KONDUSIF</option>
                  <option>WASPADA</option>
                  <option>SIAGA</option>
                </select>
              </Field>
            </div>
            <Field label="Jumlah Personel">
              <input
                type="number"
                min="0"
                value={form.personnel}
                onChange={(e) => setForm({ ...form, personnel: Number(e.target.value) })}
                className="input-map"
              />
            </Field>
            <Field label="Keterangan">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-map min-h-20 py-2"
              />
            </Field>
          </div>
          <button
            onClick={save}
            disabled={busy || !form.title.trim() || !form.location.trim()}
            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={14} />
            SIMPAN TITIK
          </button>
        </div>
      )}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[9px] font-medium tracking-wide text-slate-400">
      {label}
      {children}
    </label>
  );
}
