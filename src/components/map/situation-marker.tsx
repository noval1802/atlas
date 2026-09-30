import { memo } from "react";
import { CircleMarker } from "react-leaflet";
import type { MapAnnotation } from "@/types/map-annotation";
const colors = {
  NORMAL: "#34d399",
  TERPANTAU: "#22d3ee",
  WASPADA: "#facc15",
  SIAGA: "#fb923c",
  DARURAT: "#fb7185",
  SELESAI: "#64748b",
};
export const SituationMarker = memo(function SituationMarker({
  item,
  active,
  onHover,
}: {
  item: MapAnnotation;
  active: boolean;
  onHover: (id: string | null) => void;
}) {
  const color = colors[item.status];
  return (
    <CircleMarker
      center={[item.latitude, item.longitude]}
      radius={active ? 9 : 7}
      pathOptions={{ color, fillColor: color, fillOpacity: active ? 1 : 0.82, weight: active ? 3 : 2 }}
      eventHandlers={{ mouseover: () => onHover(item.id), mouseout: () => onHover(null) }}
    />
  );
});
