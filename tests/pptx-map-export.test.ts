import assert from "node:assert/strict";
import test from "node:test";
import { unzipSync } from "fflate";
import { buildMapPptx } from "../src/lib/pptx-map-export";

test("ekspor PPTX menghasilkan paket OpenXML dengan slide dan PNG", () => {
  const onePixelPng =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  const files = unzipSync(buildMapPptx(onePixelPng));
  assert.ok(files["[Content_Types].xml"]);
  assert.ok(files["ppt/presentation.xml"]);
  assert.ok(files["ppt/slides/slide1.xml"]);
  assert.deepEqual(files["ppt/media/image1.png"].slice(0, 4), Uint8Array.from([137, 80, 78, 71]));
});
