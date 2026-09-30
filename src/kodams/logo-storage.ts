import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { isWebp } from "./logo-validation";

export const KODAM_LOGO_MIME_TYPE = "image/webp";
export const KODAM_LOGO_MAX_BYTES = 2 * 1024 * 1024;

function uploadDirectory() {
  return process.env.KODAM_LOGO_UPLOAD_DIR || path.join(process.cwd(), "uploads", "kodam");
}

function safeFilename(filename: string) {
  if (!/^[a-zA-Z0-9_-]+\.webp$/.test(filename)) throw new Error("Nama file logo tidak valid");
  return filename;
}

export async function storeKodamLogo(kodamId: string, bytes: Uint8Array) {
  if (!isWebp(bytes)) throw new Error("Isi file bukan WebP yang valid");
  const directory = uploadDirectory();
  await mkdir(directory, { recursive: true });
  const filename = safeFilename(`${kodamId}.webp`);
  const destination = path.join(directory, filename);
  const temporary = path.join(directory, `${kodamId}-${randomUUID()}.tmp`);
  await writeFile(temporary, bytes, { flag: "wx" });
  try {
    await rename(temporary, destination);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  return filename;
}

export async function readKodamLogo(filename: string) {
  return readFile(path.join(uploadDirectory(), safeFilename(filename)));
}

export async function deleteKodamLogo(filename: string | null) {
  if (!filename) return;
  await rm(path.join(uploadDirectory(), safeFilename(filename)), { force: true });
}
