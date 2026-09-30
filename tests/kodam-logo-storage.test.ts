import assert from "node:assert/strict";
import test from "node:test";
import { isWebp } from "../src/kodams/logo-validation";

test("validator logo menerima signature WebP", () => {
  assert.equal(isWebp(Uint8Array.from(Buffer.from("RIFF0000WEBP", "ascii"))), true);
});

test("validator logo menolak file yang hanya mengaku sebagai gambar", () => {
  assert.equal(isWebp(Uint8Array.from(Buffer.from("not-a-webp", "ascii"))), false);
});
