import assert from "node:assert/strict";
import test from "node:test";
import { bangsitDocumentFolder, incidentDocumentFolder, safeDocumentPath } from "../src/documents/path";

test("kode Kodam dengan slash menjadi satu segment folder aman", () => {
  assert.equal(incidentDocumentFolder("XII/TPR", "INC-001"), "PUSDALOPS/KODAM_XII_TPR/KEJADIAN/INC-001");
});

test("folder BANGSIT memuat tahun dan bulan UTC", () => {
  assert.equal(
    bangsitDocumentFolder("XII/TPR", new Date("2026-08-24T00:00:00.000Z")),
    "PUSDALOPS/KODAM_XII_TPR/BANGSIT/2026/08",
  );
});

test("path traversal ditolak", () => {
  assert.throws(() => safeDocumentPath("PUSDALOPS/../secret"), /tidak valid/);
});
