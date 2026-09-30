import type { Incident, Status } from "@/types";
import type { AnnotationStatus, MapAnnotation } from "@/types/map-annotation";
// v2 intentionally starts with a clean annotation store after removal of all
// legacy/demo cards. The old key is left untouched for safe rollback, but is
// never read by the current map.
const key = "atlas-map-annotations-v2";
export const annotationEvent = "atlas:annotations-updated";
export function loadMapAnnotations() {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) {
      localStorage.setItem(key, "[]");
      return [];
    }
    const parsed = JSON.parse(saved) as MapAnnotation[];
    if (!Array.isArray(parsed)) return [];
    const cleaned = parsed.filter((item) => {
      if (item.source === "DUMMY") return false;
      if (item.source === "KEJADIAN" && /^INC-0822-/.test(item.sourceId ?? item.incidentId)) return false;
      if (["BENCANA", "KARHUTLA", "UNRAS"].includes(item.source ?? "")) {
        const sourceId = item.sourceId ?? item.incidentId;
        if (/^MON-/.test(sourceId) || /^(BENCANA|KARHUTLA|UNRAS)-/.test(sourceId)) return false;
      }
      return true;
    });
    if (cleaned.length !== parsed.length) localStorage.setItem(key, JSON.stringify(cleaned));
    return cleaned;
  } catch {
    return [];
  }
}
export function saveMapAnnotations(items: MapAnnotation[]) {
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(annotationEvent));
}
export function replaceSourceAnnotations(
  source: NonNullable<MapAnnotation["source"]>,
  items: MapAnnotation[],
) {
  const saved = loadMapAnnotations();
  const current = saved.filter((item) => item.source !== source && item.source !== "DUMMY");
  const previousLayout = new Map(
    saved.filter((item) => item.source === source).map((item) => [item.sourceId ?? item.id, item] as const),
  );
  saveMapAnnotations([
    ...current,
    ...items.map((item) => {
      const previous = previousLayout.get(item.sourceId ?? item.id);
      return {
        ...item,
        source,
        annotationPosition: previous?.annotationPosition ?? item.annotationPosition,
        annotationOffsetX: previous?.annotationOffsetX,
        annotationOffsetY: previous?.annotationOffsetY,
      };
    }),
  ]);
}

export function updateAnnotationOffset(id: string, offsetX: number, offsetY: number) {
  const items = loadMapAnnotations();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return;
  items[index] = {
    ...items[index],
    annotationOffsetX: Math.round(offsetX),
    annotationOffsetY: Math.round(offsetY),
  };
  saveMapAnnotations(items);
  if (typeof window !== "undefined") {
    void fetch("/api/map-annotations/layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        annotationId: id,
        offsetX: Math.round(offsetX),
        offsetY: Math.round(offsetY),
      }),
    }).catch(() => undefined);
  }
}

export function resetAnnotationLayout() {
  saveMapAnnotations(
    loadMapAnnotations().map((item) => ({
      ...item,
      annotationPosition: "auto",
      annotationOffsetX: undefined,
      annotationOffsetY: undefined,
    })),
  );
  if (typeof window !== "undefined") {
    void fetch("/api/map-annotations/layout", { method: "DELETE" }).catch(() => undefined);
  }
}

export async function syncAnnotationLayoutsFromServer() {
  if (typeof window === "undefined") return;
  const response = await fetch("/api/map-annotations/layout", { cache: "no-store" });
  if (!response.ok) return;
  const layouts = (await response.json()) as Array<{
    annotationId: string;
    offsetX: number;
    offsetY: number;
  }>;
  const byId = new Map(layouts.map((layout) => [layout.annotationId, layout]));
  const current = loadMapAnnotations();
  let changed = false;
  const next = current.map((item) => {
    const layout = byId.get(item.id);
    if (!layout) return item;
    if (item.annotationOffsetX === layout.offsetX && item.annotationOffsetY === layout.offsetY) return item;
    changed = true;
    return { ...item, annotationOffsetX: layout.offsetX, annotationOffsetY: layout.offsetY };
  });
  if (changed) saveMapAnnotations(next);
}
export function syncIncidentAnnotations(incidents: Incident[]) {
  const supported = incidents.filter(
    (item) => item.source === "ATLAS_UI" && /bencana|banjir|gempa|karhutla|unras/i.test(item.category),
  );
  replaceSourceAnnotations(
    "KEJADIAN",
    supported.map((item) => {
      const category = /karhutla/i.test(item.category)
        ? "KARHUTLA"
        : /unras/i.test(item.category)
          ? "UNRAS"
          : "BENCANA";
      return {
        id: `ANN-${item.id}`,
        incidentId: item.id,
        sourceId: item.id,
        kodam: item.kodam,
        category,
        latitude: item.latitude,
        longitude: item.longitude,
        title: item.description || item.category,
        location: item.location,
        time: `${item.time} WIB`,
        eventDate: item.eventDate,
        status: mapStatus(item.status),
        annotationPosition: "auto",
        personnel: item.personnel,
        disasterType: category === "BENCANA" ? item.category.toUpperCase() : undefined,
        crowdEstimate: category === "UNRAS" ? item.personnel : undefined,
        updatedAt: item.time,
      };
    }),
  );
}
export function syncOperationalAnnotations(title: string, rows: string[][]) {
  const source =
    title === "Kebakaran Hutan & Lahan"
      ? "KARHUTLA"
      : title === "Unjuk Rasa"
        ? "UNRAS"
        : title === "Bencana Alam"
          ? "BENCANA"
          : null;
  if (!source) return;
  const category = source === "KARHUTLA" ? "KARHUTLA" : source === "UNRAS" ? "UNRAS" : "BENCANA";
  const items = rows.flatMap((row, index) => {
    if (row[7] === "seed" || /^MON-/.test(row[6] ?? "")) return [];
    const fallback = coordinateFor(row[0], row[1]);
    const latitude = Number(row[4] || fallback[0]),
      longitude = Number(row[5] || fallback[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    const id = row[6] || `${source}-${slug(row[0])}-${index}`;
    return [
      {
        id: `ANN-${id}`,
        incidentId: id,
        sourceId: id,
        kodam: kodamFor(row[0], row[1]),
        category,
        latitude,
        longitude,
        title: row[0],
        location: source === "KARHUTLA" ? row[0] : row[0],
        time: source === "UNRAS" ? row[1] : "Update terbaru",
        eventDate: row[8] || new Date().toISOString(),
        status: normalizeStatus(row[3]),
        annotationPosition: "auto" as const,
        personnel: source === "UNRAS" ? numberFrom(row[10]) : numberFrom(row[2]),
        hotspot: source === "KARHUTLA" ? numberFrom(row[1]) : undefined,
        disasterType: category === "BENCANA" ? row[0].toUpperCase() : undefined,
        crowdEstimate: source === "UNRAS" ? numberFrom(row[9]) : undefined,
        organization: source === "UNRAS" ? row[2] : undefined,
        updatedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      } satisfies MapAnnotation,
    ];
  });
  replaceSourceAnnotations(source, items);
}

type BangsitArchive = {
  id: string;
  reportId: string;
  createdAt: string;
  kodam: { name: string };
  payload: {
    date?: string;
    time?: string;
    eventType?: string;
    location?: string;
    latitude?: string | number;
    longitude?: string | number;
    crowd?: string | number;
    personnel?: string | number;
    alut?: string;
    chronology?: string;
    status?: string;
  };
};

export function syncBangsitAnnotations(archives: BangsitArchive[]) {
  const items = archives.flatMap((archive) => {
    const payload = archive.payload;
    const latitude = Number(payload.latitude);
    const longitude = Number(payload.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    const category =
      payload.eventType === "Karhutla" ? "KARHUTLA" : payload.eventType === "Unras" ? "UNRAS" : "BENCANA";
    const time =
      payload.time ||
      new Date(archive.createdAt).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      });
    return [
      {
        id: `ANN-${archive.reportId}`,
        incidentId: archive.reportId,
        sourceId: archive.reportId,
        source: "BANGSIT" as const,
        kodam: archive.kodam.name,
        category,
        latitude,
        longitude,
        title: `${payload.eventType || "BANGSIT"} ${payload.location || ""}`.trim(),
        location: payload.location || "Lokasi tidak tersedia",
        time: `${time} WIB`,
        eventDate: payload.date || archive.createdAt,
        status: normalizeStatus(payload.status || "TERPANTAU"),
        annotationPosition: "auto" as const,
        personnel: Number(payload.personnel) || 0,
        crowdEstimate: category === "UNRAS" ? Number(payload.crowd) || 0 : undefined,
        hotspot: category === "KARHUTLA" ? Number(payload.crowd) || 0 : undefined,
        disasterType: category === "BENCANA" ? (payload.eventType || "BENCANA").toUpperCase() : undefined,
        alut: payload.alut,
        organization: category === "UNRAS" ? payload.alut : undefined,
        updatedAt: `${time} WIB`,
      } satisfies MapAnnotation,
    ];
  });
  replaceSourceAnnotations("BANGSIT", items);
}

export function upsertBangsitAnnotation(item: MapAnnotation) {
  const current = loadMapAnnotations();
  const next = current.filter((entry) => !(entry.source === "BANGSIT" && entry.sourceId === item.sourceId));
  saveMapAnnotations([...next, { ...item, source: "BANGSIT" }]);
}
function mapStatus(status: Status): AnnotationStatus {
  return status === "KONDUSIF" ? "NORMAL" : status;
}
function normalizeStatus(status: string): AnnotationStatus {
  if (status === "KONDUSIF") return "NORMAL";
  return ["NORMAL", "TERPANTAU", "WASPADA", "SIAGA", "DARURAT", "SELESAI"].includes(status)
    ? (status as AnnotationStatus)
    : "TERPANTAU";
}
function numberFrom(value?: string) {
  return Number(value?.replace(/[^0-9]/g, "") ?? "") || 0;
}
function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
function kodamFor(a: string, b: string) {
  const text = `${a} ${b}`.toLowerCase();
  if (text.includes("jakarta")) return "Kodam Jaya";
  if (text.includes("bandung")) return "Kodam III/SLW";
  if (text.includes("surabaya") || text.includes("sidoarjo")) return "Kodam V/BRW";
  if (text.includes("makassar")) return "Kodam XIV/HSN";
  if (text.includes("jayapura")) return "Kodam XVII/CEN";
  if (text.includes("riau")) return "Kodam XIX/TT";
  if (text.includes("kalimantan timur")) return "Kodam VI/MLW";
  return "Kodam Wilayah";
}
function coordinateFor(a: string, b: string): [number, number] {
  const text = `${a} ${b}`.toLowerCase();
  const entries: [[string, number, number]] | [string, number, number][] = [
    ["makassar", -5.15, 119.43],
    ["jayapura", -2.59, 140.67],
    ["bogor", -6.59, 106.79],
    ["semarang", -6.98, 110.42],
    ["riau", 0.51, 101.45],
    ["kalimantan timur", -1.24, 116.85],
    ["jawa barat", -6.91, 107.61],
    ["sumatera selatan", -2.99, 104.76],
    ["jakarta", -6.1754, 106.8272],
    ["bandung", -6.91, 107.61],
    ["surabaya", -7.25, 112.75],
  ];
  const found = entries.find(([name]) => text.includes(name));
  return found ? [found[1], found[2]] : [NaN, NaN];
}
