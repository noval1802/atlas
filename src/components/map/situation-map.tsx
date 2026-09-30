"use client";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { MAP_TILE_ATTRIBUTION, MAP_TILE_CLASS_NAME, MAP_TILE_URL } from "@/lib/map-tiles";
import { StatusBadge } from "@/components/ui/status-badge";
import { useIncidentsApi } from "@/hooks/use-incidents-api";
import { KodamMarkers } from "./kodam-markers";
const colors = { KONDUSIF: "#34d399", WASPADA: "#fbbf24", SIAGA: "#fb7185" };
export default function SituationMap() {
  const { rows, loading, error } = useIncidentsApi();
  return (
    <div className="relative">
      <MapContainer
        center={[-2.4, 118]}
        zoom={5}
        minZoom={4}
        maxZoom={12}
        scrollWheelZoom
        className="h-[390px] w-full"
        zoomControl
      >
        <TileLayer
          attribution={MAP_TILE_ATTRIBUTION}
          className={MAP_TILE_CLASS_NAME}
          crossOrigin
          url={MAP_TILE_URL}
        />
        <KodamMarkers />
        {rows.map((item) => (
          <CircleMarker
            key={item.id}
            center={[item.latitude, item.longitude]}
            radius={8}
            pathOptions={{
              color: colors[item.status],
              fillColor: colors[item.status],
              fillOpacity: 0.72,
              weight: 2,
            }}
          >
            <Popup className="atlas-popup">
              <div className="min-w-44">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] text-cyan-400">{item.id}</p>
                    <p className="mt-1 text-sm font-semibold">{item.kodam}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <dl className="grid grid-cols-[65px_1fr] gap-y-1.5 text-[11px]">
                  <dt className="text-slate-500">Jenis</dt>
                  <dd>{item.category}</dd>
                  <dt className="text-slate-500">Lokasi</dt>
                  <dd>{item.location}</dd>
                  <dt className="text-slate-500">Waktu</dt>
                  <dd>{item.time} WIB</dd>
                  <dt className="text-slate-500">Personel</dt>
                  <dd>{item.personnel} orang</dd>
                </dl>
                <p className="mt-3 border-t border-slate-700 pt-2 text-[10px] leading-relaxed text-slate-400">
                  {item.description}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      {loading && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[10px] text-slate-400">
          Memuat kejadian terbaru...
        </div>
      )}
      {error && (
        <div className="absolute inset-x-3 bottom-3 rounded border border-rose-400/20 bg-slate-950/90 p-2 text-[10px] text-rose-300">
          {error}
        </div>
      )}
    </div>
  );
}
