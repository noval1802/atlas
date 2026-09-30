const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
const MAX_SOURCE_PIXELS = 16_000_000;
const OUTPUT_SIZE = 512;

export async function prepareKodamLogo(file: File) {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) throw new Error("Logo harus berformat PNG, JPEG, atau WebP");
  if (file.size < 1 || file.size > MAX_SOURCE_BYTES) throw new Error("Ukuran logo maksimal 2 MB");

  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width < 1 || bitmap.height < 1 || bitmap.width * bitmap.height > MAX_SOURCE_PIXELS) {
      throw new Error("Dimensi logo tidak diizinkan");
    }
    const scale = Math.min(OUTPUT_SIZE / bitmap.width, OUTPUT_SIZE / bitmap.height, 1);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Logo tidak dapat diproses");
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
    if (!blob || blob.size < 1 || blob.size > MAX_SOURCE_BYTES) {
      throw new Error("Logo WebP tidak dapat dibuat");
    }
    return new File([blob], "logo-kotamaops.webp", { type: "image/webp" });
  } finally {
    bitmap.close();
  }
}

export async function uploadKodamLogo(kodamId: string, file: File) {
  const body = new FormData();
  body.set("file", file);
  const response = await fetch(`/api/kodams/${encodeURIComponent(kodamId)}/logo`, {
    method: "POST",
    body,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Logo Kotamaops gagal diunggah");
  return data;
}
