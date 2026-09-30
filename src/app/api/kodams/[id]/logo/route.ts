import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { apiError, authorizationError } from "@/http/api-response";
import { prisma } from "@/lib/prisma";
import {
  KODAM_LOGO_MAX_BYTES,
  KODAM_LOGO_MIME_TYPE,
  readKodamLogo,
  storeKodamLogo,
} from "@/kodams/logo-storage";
import { isWebp } from "@/kodams/logo-validation";
import { auditJson, writeAuditLog } from "@/security/audit";
import { protectMutation } from "@/security/request-security";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

async function findKodam(id: string) {
  return prisma.kodam.findFirst({ where: { OR: [{ id }, { slug: id }] } });
}

export async function GET(_: Request, { params }: Context) {
  const { id } = await params;
  const principal = await getAuthPrincipal();
  const kodam = await findKodam(id);
  if (!kodam) return apiError("Kotamaops tidak ditemukan", 404);
  const access = authorize(principal, "kodam:read", kodam.code);
  if (!access.ok) return authorizationError(access);
  if (!kodam.logoFilename) return apiError("Logo Kotamaops tidak ditemukan", 404);
  try {
    const bytes = await readKodamLogo(kodam.logoFilename);
    return new Response(bytes, {
      headers: {
        "Content-Type": kodam.logoMimeType || KODAM_LOGO_MIME_TYPE,
        "Cache-Control": "private, max-age=86400, immutable",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return apiError("File logo Kotamaops tidak ditemukan", 404);
  }
}

export async function POST(request: Request, { params }: Context) {
  const blocked = protectMutation(request, 20);
  if (blocked) return blocked;
  const { id } = await params;
  const principal = await getAuthPrincipal();
  const kodam = await findKodam(id);
  if (!kodam) return apiError("Kotamaops tidak ditemukan", 404);
  const access = authorize(principal, "kodam:update", kodam.code);
  if (!access.ok) return authorizationError(access);
  if (!principal) return apiError("Autentikasi diperlukan", 401);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    return apiError("Content-Type harus multipart/form-data", 415);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError("Form upload tidak valid", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return apiError("File logo wajib diisi", 400);
  if (file.size < 1 || file.size > KODAM_LOGO_MAX_BYTES) return apiError("Ukuran logo maksimal 2 MB", 413);
  if (file.type !== KODAM_LOGO_MIME_TYPE) return apiError("Logo hasil proses harus berformat WebP", 415);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isWebp(bytes)) return apiError("Isi file logo tidak valid", 415);

  try {
    const filename = await storeKodamLogo(kodam.id, bytes);
    const updated = await prisma.kodam.update({
      where: { id: kodam.id },
      data: { logoFilename: filename, logoMimeType: KODAM_LOGO_MIME_TYPE, logoUpdatedAt: new Date() },
    });
    await writeAuditLog({
      request,
      principal,
      action: "UPLOAD_KODAM_LOGO",
      entity: "Kodam",
      entityId: kodam.id,
      oldValue: auditJson(kodam),
      newValue: auditJson(updated),
      metadata: { code: kodam.code, role: principal.role, bytes: file.size },
    });
    return Response.json(updated);
  } catch {
    return apiError("Logo Kotamaops gagal disimpan", 500);
  }
}
