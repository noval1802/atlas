import { NextResponse } from "next/server";
import { authorizeIncidentDocument } from "@/documents/incident-access";
import { getDocumentStorage } from "@/documents/local-storage";
import { incidentDocumentFolder, safeDocumentSegment } from "@/documents/path";
import { apiError, documentStorageError } from "@/http/api-response";
import { prisma } from "@/lib/prisma";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation } from "@/security/request-security";

type Context = { params: Promise<{ id: string }> };
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export async function GET(_: Request, { params }: Context) {
  const { id } = await params;
  const access = await authorizeIncidentDocument(id, "document:read");
  if (!access.ok) return apiError(access.error, access.status);
  return NextResponse.json(
    await prisma.documentReference.findMany({ where: { incidentId: id }, orderBy: { createdAt: "desc" } }),
  );
}

export async function POST(request: Request, { params }: Context) {
  const blocked = protectMutation(request, 20);
  if (blocked) return blocked;
  const { id } = await params;
  const access = await authorizeIncidentDocument(id, "document:upload");
  if (!access.ok) return apiError(access.error, access.status);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data"))
    return apiError("Content-Type harus multipart/form-data", 415);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError("Form upload tidak valid", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return apiError("File wajib diisi", 400);
  const maxBytes = Number(process.env.DOCUMENT_MAX_UPLOAD_BYTES ?? 25 * 1024 * 1024);
  if (!Number.isSafeInteger(maxBytes) || file.size < 1 || file.size > maxBytes)
    return apiError("Ukuran file tidak diizinkan", 413);
  if (!ALLOWED_TYPES.has(file.type)) return apiError("Tipe file tidak diizinkan", 415);
  try {
    const filename = safeDocumentSegment(file.name);
    const folder = incidentDocumentFolder(access.incident.kodam.code, id);
    const path = `${folder}/${filename}`;
    const stored = await getDocumentStorage().uploadFile(
      path,
      new Uint8Array(await file.arrayBuffer()),
      file.type,
    );
    const reference = await prisma.documentReference.upsert({
      where: { incidentId_path: { incidentId: id, path } },
      update: {
        nextcloudFileId: stored.fileId,
        filename,
        mimeType: file.type,
        uploadedBy: access.principal.id ?? access.principal.email ?? "unknown",
      },
      create: {
        incidentId: id,
        nextcloudFileId: stored.fileId,
        filename,
        mimeType: file.type,
        path,
        uploadedBy: access.principal.id ?? access.principal.email ?? "unknown",
      },
    });
    await writeAuditLog({
      request,
      principal: access.principal,
      action: "UPLOAD_DOCUMENT",
      entity: "DocumentReference",
      entityId: reference.id,
      newValue: auditJson(reference),
      metadata: { incidentId: id, role: access.principal.role },
    });
    return NextResponse.json(reference, { status: 201 });
  } catch (error) {
    return documentStorageError(error, "Dokumen gagal diproses");
  }
}
