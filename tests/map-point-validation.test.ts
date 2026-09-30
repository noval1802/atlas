import assert from "node:assert/strict";
import test from "node:test";
import { mapPointSchema } from "../src/map-points/schema";

const valid = {
  title: "Posko Banjir",
  kodam: "Kodam XII/TPR",
  location: "Kubu Raya",
  category: "Bencana Alam",
  description: "Posko lapangan",
  status: "WASPADA",
  personnel: 120,
  latitude: -0.02,
  longitude: 109.34,
};

test("titik peta menerima koordinat dan data operasional valid", () => {
  assert.equal(mapPointSchema.safeParse(valid).success, true);
});

test("titik peta menolak koordinat dan personel di luar batas", () => {
  assert.equal(mapPointSchema.safeParse({ ...valid, latitude: -91 }).success, false);
  assert.equal(mapPointSchema.safeParse({ ...valid, personnel: -1 }).success, false);
});
