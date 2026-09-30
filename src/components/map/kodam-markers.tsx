"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import L from "leaflet";
import { Marker, Popup, Tooltip } from "react-leaflet";
import { MapPin, Users } from "lucide-react";
import { kodams, type KodamData } from "@/data/kodam";
import { fetchKodams } from "@/kodams/client";
import { StatusBadge } from "@/components/ui/status-badge";
const colors = { KONDUSIF: "#22d3ee", WASPADA: "#fbbf24", SIAGA: "#fb7185" };
export function KodamMarkers() {
  const [points, setPoints] = useState(kodams);
  useEffect(() => {
    const refresh = () => {
      fetchKodams()
        .then(setPoints)
        .catch(() => undefined);
    };
    refresh();
    window.addEventListener("atlas:kodams-updated", refresh);
    return () => {
      window.removeEventListener("atlas:kodams-updated", refresh);
    };
  }, []);
  return (
    <>
      {points.map((k) => (
        <KodamMarker key={`kodam-${k.id}`} data={k} />
      ))}
    </>
  );
}
function KodamMarker({ data: k }: { data: KodamData }) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "kodam-map-icon",
        html: `<div style="--marker-color:${colors[k.status]}"><img src="${k.logo}" alt="" /></div>`,
        iconSize: [42, 50],
        iconAnchor: [21, 46],
        popupAnchor: [0, -44],
        tooltipAnchor: [0, -42],
      }),
    [k.logo, k.status],
  );
  return (
    <Marker position={[k.latitude, k.longitude]} icon={icon}>
      <Tooltip direction="top" opacity={0.96}>
        <span className="text-[10px] font-semibold">{k.name}</span>
      </Tooltip>
      <Popup className="atlas-popup">
        <div className="min-w-56">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="relative h-12 w-12 shrink-0">
                <Image
                  src={k.logo}
                  alt={`Logo ${k.name}`}
                  fill
                  sizes="48px"
                  className="object-contain"
                  unoptimized={k.logo.startsWith("/api/")}
                />
              </span>
              <div>
                <p className="text-[9px] font-bold tracking-widest text-cyan-400">LOKASI KOTAMAOPS</p>
                <p className="mt-1 text-sm font-semibold">{k.name}</p>
                <p className="mt-1 font-mono text-[9px] text-slate-500">{k.code}</p>
              </div>
            </div>
            <StatusBadge status={k.status} />
          </div>
          <p className="mt-3 flex items-center gap-1 text-[10px] text-slate-400">
            <MapPin size={11} />
            {k.location} • {k.region}
          </p>
          <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
            <Users size={11} />
            {k.personnel.toLocaleString("id-ID")} personel • {k.deployed.toLocaleString("id-ID")} dikerahkan
          </p>
          <p className="mt-2 font-mono text-[9px] text-slate-600">
            {k.latitude}, {k.longitude}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
