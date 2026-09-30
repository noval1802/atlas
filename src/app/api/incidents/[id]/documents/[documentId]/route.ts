import { authorizeIncidentDocument } from "@/documents/incident-access";
import { getDocumentStorage } from "@/documents/local-storage";
import { apiError, documentStorageError } from "@/http/api-response";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string; documentId: string }> };

export async function GET(_: Request, { params }: Context) {
  const { id, documentId } = await params;
  const access = await authorizeIncidentDocument(id, "document:read");
  if (!access.ok) return apiError(access.error, access.status);
  const reference = await prisma.documentReference.findFirst({ where: { id: documentId, incidentId: id } });
  if (!reference) return apiError("Dokumen tidak ditemukan", 404);
  try {
    const upstream = await getDocumentStorage().getFile(reference.path);
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type":
          reference.mimeType ?? upstream.headers.get("Content-Type") ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(reference.filename)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return documentStorageError(error, "Dokumen gagal diunduh");
  }
}
