import assert from "node:assert/strict";
import test from "node:test";
import { arrangeAnnotationCards } from "../src/lib/annotation-layout";

test("auto arrange memilih posisi alternatif untuk marker yang berdekatan", () => {
  const result = arrangeAnnotationCards(
    [
      { id: "a", marker: { x: 400, y: 300 } },
      { id: "b", marker: { x: 405, y: 305 } },
    ],
    { width: 1000, height: 700 },
    { width: 202, height: 142 },
  );
  assert.equal(result.length, 2);
  assert.notDeepEqual(result[0], result[1]);
});

test("auto arrange mempertahankan offset manual dan membatasi card dalam viewport", () => {
  const [result] = arrangeAnnotationCards(
    [{ id: "a", marker: { x: 10, y: 10 }, manualOffset: { x: -500, y: -500 } }],
    { width: 800, height: 500 },
    { width: 202, height: 142 },
  );
  assert.equal(result.x, 8);
  assert.equal(result.y, 8);
});
