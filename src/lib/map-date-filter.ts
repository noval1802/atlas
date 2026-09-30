export type MapDateFilter = "ALL" | "TODAY" | "LAST_7_DAYS" | "CUSTOM";

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
const dayInMilliseconds = 24 * 60 * 60 * 1000;

export function jakartaDateKey(value: string | undefined, now = new Date()): string | null {
  if (!value) return null;
  if (dateOnlyPattern.test(value)) return value;

  const date = value === "NOW" ? now : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function matchesMapDate(
  eventDate: string | undefined,
  filter: MapDateFilter,
  customDate: string,
  now = new Date(),
) {
  if (filter === "ALL") return true;

  const eventKey = jakartaDateKey(eventDate, now);
  if (!eventKey) return false;

  const todayKey = jakartaDateKey("NOW", now)!;
  if (filter === "TODAY") return eventKey === todayKey;
  if (filter === "CUSTOM") return customDate !== "" && eventKey === customDate;

  const age = Date.parse(`${todayKey}T00:00:00Z`) - Date.parse(`${eventKey}T00:00:00Z`);
  return age >= 0 && age < 7 * dayInMilliseconds;
}
