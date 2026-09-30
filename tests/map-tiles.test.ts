import assert from "node:assert/strict";
import test from "node:test";
import { MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "../src/lib/map-tiles";

test("basemap memakai endpoint OpenStreetMap tanpa API key", () => {
  assert.equal(MAP_TILE_URL, "https://tile.openstreetmap.org/{z}/{x}/{y}.png");
  assert.doesNotMatch(MAP_TILE_URL, /(?:api[_-]?key|access[_-]?token|[?&](?:key|token)=)/i);
});

test("basemap mempertahankan attribution OpenStreetMap", () => {
  assert.match(MAP_TILE_ATTRIBUTION, /openstreetmap\.org\/copyright/i);
});
