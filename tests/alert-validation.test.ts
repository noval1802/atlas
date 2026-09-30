import assert from "node:assert/strict";
import test from "node:test";
import { alertSchema } from "../src/alerts/schema";

test("early warning memvalidasi level, status, dan isi", () => {
  const result = alertSchema.safeParse({
    level: "WARNING",
    title: "Kenaikan hotspot",
    message: "Terjadi peningkatan dalam satu jam",
    kodam: "Kodam XII/TPR",
    metric: "3 → 11",
    status: "WASPADA",
  });
  assert.equal(result.success, true);
});

test("early warning menolak level tidak dikenal", () => {
  const result = alertSchema.safeParse({
    level: "DANGER",
    title: "Kenaikan hotspot",
    message: "Terjadi peningkatan",
    kodam: "Kodam XII/TPR",
    metric: "11",
    status: "WASPADA",
  });
  assert.equal(result.success, false);
});
