import { memo, useRef } from "react";
import { Flame, GripHorizontal, Maximize2, Megaphone, Minimize2, TriangleAlert } from "lucide-react";
import type { MapAnnotation } from "@/types/map-annotation";
const accents = { BENCANA: "#38bdf8", KARHUTLA: "#fb923c", UNRAS: "#facc15" };
const icons = { BENCANA: TriangleAlert, KARHUTLA: Flame, UNRAS: Megaphone };
export const CARD_WIDTH = 202;
export const CARD_HEIGHT = 142;
export const SituationAnnotation = memo(function SituationAnnotation({
  item,
  x,
  y,
  active,
  expanded,
  editable,
  presentation,
  onHover,
  onToggle,
  onDragStart,
  onDrag,
  onDragEnd,
}: {
  item: MapAnnotation;
  x: number;
  y: number;
  active: boolean;
  expanded: boolean;
  editable: boolean;
  presentation: boolean;
  onHover: (id: string | null) => void;
  onToggle: (id: string) => void;
  onDragStart: (id: string) => void;
  onDrag: (id: string, deltaX: number, deltaY: number) => void;
  onDragEnd: (id: string) => void;
}) {
  const Icon = icons[item.category],
    accent = accents[item.category];
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${expanded ? "Perkecil" : "Perbesar"} annotation ${item.title}`}
      onClick={(e) => {
        e.stopPropagation();
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        onToggle(item.id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(item.id);
        }
      }}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      className={`situation-annotation-card pointer-events-auto absolute origin-center rounded-lg border bg-[#07111f]/94 text-left shadow-xl backdrop-blur-sm transition-transform duration-200 ${editable ? "cursor-default" : "cursor-pointer"} ${expanded ? "z-30 scale-[1.5]" : presentation ? "z-20 scale-[1.18]" : active ? "z-20 scale-[1.035]" : "z-10"}`}
      style={{
        left: x,
        top: y,
        width: CARD_WIDTH,
        minHeight: CARD_HEIGHT,
        borderColor: `${accent}66`,
        boxShadow: active || expanded ? `0 0 26px ${accent}44` : undefined,
      }}
    >
      <header
        className={`flex items-center justify-between border-b border-slate-700/70 px-3 py-2 ${editable ? "cursor-move touch-none select-none" : ""}`}
        onPointerDown={(event) => {
          if (!editable || event.button !== 0) return;
          event.stopPropagation();
          dragStart.current = { x: event.clientX, y: event.clientY };
          dragged.current = false;
          event.currentTarget.setPointerCapture(event.pointerId);
          onDragStart(item.id);
        }}
        onPointerMove={(event) => {
          if (!dragStart.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const deltaX = event.clientX - dragStart.current.x;
          const deltaY = event.clientY - dragStart.current.y;
          if (Math.abs(deltaX) + Math.abs(deltaY) > 3) dragged.current = true;
          onDrag(item.id, deltaX, deltaY);
        }}
        onPointerUp={(event) => {
          if (!dragStart.current) return;
          event.stopPropagation();
          dragStart.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
          onDragEnd(item.id);
        }}
        onPointerCancel={() => {
          if (!dragStart.current) return;
          dragStart.current = null;
          onDragEnd(item.id);
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Icon size={13} style={{ color: accent }} />
          <p className="truncate text-[9px] font-bold tracking-[.08em] text-slate-100">
            {item.kodam.toUpperCase()}
          </p>
        </div>
        <span className="flex items-center gap-1.5">
          {editable && <GripHorizontal size={12} className="text-cyan-400" aria-label="Geser annotation" />}
          <span className="text-slate-500">
            {expanded ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
          </span>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
        </span>
      </header>
      <div className="px-3 py-2">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[9px] font-bold tracking-[.12em]" style={{ color: accent }}>
            {item.category}
          </p>
          <span
            className="rounded border px-1.5 py-0.5 text-[8px] font-bold"
            style={{ color: statusColor(item.status), borderColor: `${statusColor(item.status)}55` }}
          >
            {item.status}
          </span>
        </div>
        <Rows item={item} />
        {expanded && (
          <p className="mt-2 border-t border-slate-700/60 pt-1.5 text-center text-[7px] tracking-wider text-slate-500">
            KLIK UNTUK PERKECIL
          </p>
        )}
      </div>
    </article>
  );
});
function Rows({ item }: Readonly<{ item: MapAnnotation }>) {
  if (item.category === "KARHUTLA")
    return (
      <dl className="annotation-grid">
        <dt>HOTSPOT</dt>
        <dd>{item.hotspot} TITIK</dd>
        <dt>LUAS</dt>
        <dd>
          {item.affectedArea?.toLocaleString("id-ID")} {item.affectedAreaUnit}
        </dd>
        <dt>PERS SIAGA</dt>
        <dd>{item.personnel.toLocaleString("id-ID")} ORG</dd>
        <dt>ALUT</dt>
        <dd>{item.alut}</dd>
      </dl>
    );
  if (item.category === "BENCANA")
    return (
      <dl className="annotation-grid">
        <dt>JENIS</dt>
        <dd>{item.disasterType}</dd>
        <dt>LOKASI</dt>
        <dd>{item.location.toUpperCase()}</dd>
        <dt>TERDAMPAK</dt>
        <dd>{item.affectedFamilies} KK</dd>
        <dt>PERS SIAGA</dt>
        <dd>{item.personnel} ORG</dd>
      </dl>
    );
  return (
    <dl className="annotation-grid">
      <dt>LOKASI</dt>
      <dd>{item.location.toUpperCase()}</dd>
      <dt>PUKUL</dt>
      <dd>{item.time}</dd>
      <dt>MASSA</dt>
      <dd>±{item.crowdEstimate} ORG</dd>
      <dt>PERS PAM</dt>
      <dd>{item.personnel.toLocaleString("id-ID")} ORG</dd>
      <dt>ORGANISASI</dt>
      <dd className="truncate">{item.organization}</dd>
    </dl>
  );
}
export function annotationColor(category: MapAnnotation["category"]) {
  return accents[category];
}
function statusColor(status: MapAnnotation["status"]) {
  return {
    NORMAL: "#34d399",
    TERPANTAU: "#22d3ee",
    WASPADA: "#facc15",
    SIAGA: "#fb923c",
    DARURAT: "#fb7185",
    SELESAI: "#64748b",
  }[status];
}
