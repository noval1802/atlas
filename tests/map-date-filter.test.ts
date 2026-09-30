import assert from "node:assert/strict";
import test from "node:test";
import { jakartaDateKey, matchesMapDate } from "../src/lib/map-date-filter";

const now = new Date("2026-08-26T13:00:00.000Z");

test("tanggal ISO dikonversi menggunakan zona WIB", () => {
  assert.equal(jakartaDateKey("2026-08-25T18:30:00.000Z", now), "2026-08-26");
});

test("filter hari ini menerima hanya annotation hari ini", () => {
  assert.equal(matchesMapDate("2026-08-26T02:00:00.000Z", "TODAY", "", now), true);
  assert.equal(matchesMapDate("2026-08-25T02:00:00.000Z", "TODAY", "", now), false);
});

test("filter tujuh hari menolak data lama dan tanggal masa depan", () => {
  assert.equal(matchesMapDate("2026-08-20", "LAST_7_DAYS", "", now), true);
  assert.equal(matchesMapDate("2026-08-19", "LAST_7_DAYS", "", now), false);
  assert.equal(matchesMapDate("2026-08-27", "LAST_7_DAYS", "", now), false);
});

test("filter tanggal spesifik dan semua tanggal", () => {
  assert.equal(matchesMapDate("2026-08-21", "CUSTOM", "2026-08-21", now), true);
  assert.equal(matchesMapDate(undefined, "CUSTOM", "2026-08-21", now), false);
  assert.equal(matchesMapDate(undefined, "ALL", "", now), true);
});
