import assert from "node:assert/strict";
import test from "node:test";
import {
  loadMapAnnotations,
  resetAnnotationLayout,
  syncOperationalAnnotations,
  updateAnnotationOffset,
} from "../src/lib/map-annotation-storage";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

test("Karhutla membuat line card dan penghapusan data membersihkannya", () => {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { dispatchEvent: () => true },
  });

  storage.setItem("atlas-map-annotations-v1", JSON.stringify([{ id: "CARD-LAMA" }]));
  assert.deepEqual(loadMapAnnotations(), []);

  syncOperationalAnnotations("Kebakaran Hutan & Lahan", [
    ["Riau", "3 hotspot", "12 personel", "WASPADA", "0.51", "101.45", "karhutla-baru", "user"],
  ]);
  const created = loadMapAnnotations();
  assert.equal(created.length, 1);
  assert.equal(created[0].source, "KARHUTLA");
  assert.equal(created[0].sourceId, "karhutla-baru");

  syncOperationalAnnotations("Kebakaran Hutan & Lahan", []);
  assert.deepEqual(loadMapAnnotations(), []);

  Reflect.deleteProperty(globalThis, "localStorage");
  Reflect.deleteProperty(globalThis, "window");
});

test("offset manual bertahan saat data sumber disinkronkan dan dapat direset", () => {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { dispatchEvent: () => true },
  });
  const row = ["Riau", "3 hotspot", "12 personel", "WASPADA", "0.51", "101.45", "karhutla-layout", "user"];
  syncOperationalAnnotations("Kebakaran Hutan & Lahan", [row]);
  updateAnnotationOffset("ANN-karhutla-layout", 121.4, -79.6);
  syncOperationalAnnotations("Kebakaran Hutan & Lahan", [[...row.slice(0, 1), "4 hotspot", ...row.slice(2)]]);

  assert.equal(loadMapAnnotations()[0].annotationOffsetX, 121);
  assert.equal(loadMapAnnotations()[0].annotationOffsetY, -80);
  resetAnnotationLayout();
  assert.equal(loadMapAnnotations()[0].annotationPosition, "auto");
  assert.equal(loadMapAnnotations()[0].annotationOffsetX, undefined);
  assert.equal(loadMapAnnotations()[0].annotationOffsetY, undefined);

  Reflect.deleteProperty(globalThis, "localStorage");
  Reflect.deleteProperty(globalThis, "window");
});

test("Unras memakai field massa dan personel terstruktur, bukan nama organisasi", () => {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { dispatchEvent: () => true },
  });

  syncOperationalAnnotations("Unjuk Rasa", [
    [
      "Jakarta Pusat",
      "08:20",
      "Aliansi Pekerja 99",
      "WASPADA",
      "-6.1754",
      "106.8272",
      "unras-terstruktur",
      "user",
      "2026-09-17T08:20:00.000Z",
      "1200",
      "360",
    ],
  ]);

  const [created] = loadMapAnnotations();
  assert.equal(created.organization, "Aliansi Pekerja 99");
  assert.equal(created.crowdEstimate, 1200);
  assert.equal(created.personnel, 360);

  Reflect.deleteProperty(globalThis, "localStorage");
  Reflect.deleteProperty(globalThis, "window");
});
