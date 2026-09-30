const SEGMENT = /^[\p{L}\p{N}._ -]+$/u;

export function safeDocumentSegment(value: string): string {
  const normalized = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (!normalized || normalized === "." || normalized === ".." || !SEGMENT.test(normalized)) {
    throw new Error("Nama file atau folder tidak valid");
  }
  return normalized;
}

export function safeDocumentPath(path: string): string {
  return path.split("/").filter(Boolean).map(safeDocumentSegment).join("/");
}

export function incidentDocumentFolder(kodamCode: string, incidentId: string): string {
  const kodamFolder = safeDocumentSegment(`KODAM_${kodamCode.replaceAll("/", "_").replaceAll(" ", "_")}`);
  return ["PUSDALOPS", kodamFolder, "KEJADIAN", safeDocumentSegment(incidentId)].join("/");
}

export function bangsitDocumentFolder(kodamCode: string, date: Date): string {
  const kodamFolder = safeDocumentSegment(`KODAM_${kodamCode.replaceAll("/", "_").replaceAll(" ", "_")}`);
  return [
    "PUSDALOPS",
    kodamFolder,
    "BANGSIT",
    String(date.getUTCFullYear()),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
  ].join("/");
}
