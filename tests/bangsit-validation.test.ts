import assert from "node:assert/strict";
import test from "node:test";
import { bangsitArchiveSchema } from "../src/bangsit/schema";

const valid = {
  date: "2026-08-24",
  time: "10:30",
  kodam: "Kodam XII/TPR",
  eventType: "Bencana Alam",
  location: "Kubu Raya",
  latitude: "-0.02",
  longitude: "109.34",
  crowd: "12",
  personnel: "48",
  alut: "2 kendaraan",
  chronology: "Pemantauan lapangan berjalan terkendali.",
  status: "WASPADA",
};

test("payload BANGSIT valid dinormalisasi", () => {
  const parsed = bangsitArchiveSchema.parse(valid);
  assert.equal(parsed.latitude, -0.02);
  assert.equal(parsed.personnel, 48);
});

test("koordinat di luar batas ditolak", () => {
  assert.equal(bangsitArchiveSchema.safeParse({ ...valid, latitude: 91 }).success, false);
});

test("kronologi terlalu pendek ditolak", () => {
  assert.equal(bangsitArchiveSchema.safeParse({ ...valid, chronology: "abc" }).success, false);
});
