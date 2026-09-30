import assert from "node:assert/strict";
import test from "node:test";
import { hasRequiredUnrasMetrics, operationalRecordSchema } from "../src/monitoring/schema";
import { isMonitoringModule, monitoringPermissions } from "../src/monitoring/config";
import { kodamCreateSchema, kodamUpdateSchema } from "../src/kodams/schema";

test("hanya modul monitoring yang didukung diterima", () => {
  assert.equal(isMonitoringModule("bencana"), true);
  assert.equal(isMonitoringModule("resources"), true);
  assert.equal(isMonitoringModule("unknown"), false);
  assert.equal(monitoringPermissions.karhutla.write, "karhutla:write");
});

test("record monitoring valid menerima koordinat", () => {
  const result = operationalRecordSchema.safeParse({
    primary: "Banjir",
    secondary: "Kubu Raya",
    detail: "Terkendali",
    status: "WASPADA",
    latitude: -0.02,
    longitude: 109.34,
  });
  assert.equal(result.success, true);
});

test("record monitoring menolak koordinat di luar batas", () => {
  const result = operationalRecordSchema.safeParse({
    primary: "Banjir",
    secondary: "Kubu Raya",
    detail: "Terkendali",
    status: "WASPADA",
    latitude: -91,
    longitude: 109.34,
  });
  assert.equal(result.success, false);
});

test("record Unras menerima estimasi massa dan personel terstruktur", () => {
  const result = operationalRecordSchema.safeParse({
    primary: "Jakarta Pusat",
    secondary: "08:20",
    detail: "Aliansi Pekerja",
    status: "WASPADA",
    latitude: -6.1754,
    longitude: 106.8272,
    crowdEstimate: 1200,
    personnel: 360,
  });
  assert.equal(result.success, true);
  assert.equal(result.success && hasRequiredUnrasMetrics(result.data), true);
});

test("record monitoring menolak jumlah massa atau personel negatif", () => {
  const result = operationalRecordSchema.safeParse({
    primary: "Jakarta Pusat",
    secondary: "08:20",
    detail: "Aliansi Pekerja",
    status: "WASPADA",
    crowdEstimate: -1,
    personnel: 360,
  });
  assert.equal(result.success, false);
});

test("validasi Kodam menolak status tidak dikenal", () => {
  const result = kodamUpdateSchema.safeParse({
    name: "Kodam XII/TPR",
    code: "XII/TPR",
    region: "Kalimantan Barat",
    location: "Kubu Raya",
    latitude: -0.02,
    longitude: 109.34,
    status: "DARURAT",
    personnel: 2700,
  });
  assert.equal(result.success, false);
});

test("validasi Kotamaops menerima data baru yang lengkap", () => {
  const result = kodamCreateSchema.safeParse({
    name: "Kogabwilhan I",
    code: "KOGAB-I",
    region: "Wilayah Barat",
    location: "Tanjung Pinang",
    latitude: 0.9186,
    longitude: 104.4665,
    status: "KONDUSIF",
    personnel: 1200,
    deployed: 200,
  });
  assert.equal(result.success, true);
});

test("validasi Kotamaops menolak personel dikerahkan melebihi kekuatan", () => {
  const result = kodamCreateSchema.safeParse({
    name: "Kogabwilhan I",
    code: "KOGAB-I",
    region: "Wilayah Barat",
    location: "Tanjung Pinang",
    latitude: 0.9186,
    longitude: 104.4665,
    status: "KONDUSIF",
    personnel: 100,
    deployed: 101,
  });
  assert.equal(result.success, false);
});
