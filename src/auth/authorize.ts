import type { Permission } from "./permissions";
import { hasPermission } from "./permissions";
import { canonicalKodamScope } from "./group-mapping";
import type { AppRole } from "./roles";

export type AuthPrincipal = {
  id?: string;
  name?: string | null;
  email?: string | null;
  role: AppRole;
  kodamScope: string[];
};

export type AuthorizationResult = { ok: true } | { ok: false; status: 401 | 403; error: string };

export function authorize(
  principal: AuthPrincipal | null,
  permission: Permission,
  resourceKodamCode?: string | null,
): AuthorizationResult {
  if (!principal) return { ok: false, status: 401, error: "Autentikasi diperlukan" };
  if (!hasPermission(principal.role, permission)) return { ok: false, status: 403, error: "Akses ditolak" };

  if (principal.role === "OPERATOR_KODAM" && resourceKodamCode) {
    const resourceScope = canonicalKodamScope(resourceKodamCode);
    const allowed = principal.kodamScope.some((scope) => canonicalKodamScope(scope) === resourceScope);
    if (!allowed) return { ok: false, status: 403, error: "Data berada di luar cakupan Kodam" };
  }

  return { ok: true };
}

export function scopedKodamCodes(principal: AuthPrincipal): string[] | null {
  return principal.role === "OPERATOR_KODAM" ? principal.kodamScope : null;
}
