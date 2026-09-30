import assert from "node:assert/strict";
import test from "node:test";
import { parseCoordinatePair } from "../src/kodams/coordinates";

test("koordinat Kotamaops menerima format latitude, longitude", () => {
  assert.deepEqual(parseCoordinatePair("-5.966408, 107.314146"), {
    latitude: -5.966408,
    longitude: 107.314146,
  });
});

test("koordinat Kotamaops menerima pemisah titik koma", () => {
  assert.deepEqual(parseCoordinatePair("-5.966408;107.314146"), {
    latitude: -5.966408,
    longitude: 107.314146,
  });
});

test("koordinat Kotamaops menolak format atau rentang yang tidak valid", () => {
  assert.equal(parseCoordinatePair("-5.966408"), null);
  assert.equal(parseCoordinatePair("91, 107.314146"), null);
  assert.equal(parseCoordinatePair("-5.966408, 181"), null);
});
