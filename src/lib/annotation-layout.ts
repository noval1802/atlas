export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type LayoutItem = {
  id: string;
  marker: Point;
  manualOffset?: Point;
};
export type LayoutResult = { id: string; x: number; y: number };

const gap = 12;

function overlaps(a: LayoutResult, b: LayoutResult, card: Size) {
  return !(
    a.x + card.width + gap <= b.x ||
    b.x + card.width + gap <= a.x ||
    a.y + card.height + gap <= b.y ||
    b.y + card.height + gap <= a.y
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function arrangeAnnotationCards(items: LayoutItem[], viewport: Size, card: Size): LayoutResult[] {
  const candidates: Point[] = [
    { x: 34, y: -card.height - 24 },
    { x: -card.width - 34, y: -card.height - 24 },
    { x: 34, y: 24 },
    { x: -card.width - 34, y: 24 },
    { x: 38, y: -card.height / 2 },
    { x: -card.width - 38, y: -card.height / 2 },
    { x: -card.width / 2, y: -card.height - 34 },
    { x: -card.width / 2, y: 34 },
  ];
  const placed: LayoutResult[] = [];
  for (const item of items) {
    const offsets = item.manualOffset ? [item.manualOffset] : candidates;
    let selected: LayoutResult | undefined;
    let fallback: LayoutResult | undefined;
    for (const offset of offsets) {
      const candidate = {
        id: item.id,
        x: clamp(item.marker.x + offset.x, 8, Math.max(8, viewport.width - card.width - 8)),
        y: clamp(item.marker.y + offset.y, 8, Math.max(8, viewport.height - card.height - 8)),
      };
      fallback ??= candidate;
      if (!placed.some((other) => overlaps(candidate, other, card))) {
        selected = candidate;
        break;
      }
    }
    placed.push(selected ?? fallback!);
  }
  return placed;
}
