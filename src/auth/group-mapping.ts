import type { AppRole } from "./roles";

const ROLE_GROUPS: Array<[RegExp, AppRole]> = [
  [/(^|\/)atlas[-_/ ]super[-_ ]?admin$/i, "SUPER_ADMIN"],
  [/(^|\/)atlas[-_/ ]admin$/i, "ADMIN"],
  [/(^|\/)atlas[-_/ ]operator[-_ ]?pusdalops$/i, "OPERATOR_PUSDALOPS"],
  [/(^|\/)atlas[-_/ ]operator[-_ ]?kodam$/i, "OPERATOR_KODAM"],
  [/(^|\/)atlas[-_/ ]analyst$/i, "ANALYST"],
  [/(^|\/)atlas[-_/ ]pimpinan$/i, "PIMPINAN"],
];

const KODAM_SCOPE_ALIASES: Record<string, string> = {
  "KODAM-XII": "XII/TPR",
  XII: "XII/TPR",
};

export function canonicalKodamScope(code: string): string {
  const normalized = code.trim().toUpperCase();
  return KODAM_SCOPE_ALIASES[normalized] ?? normalized;
}

function strings(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return typeof value === "string"
    ? value
        .split(/[;,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

export function mapGroupsToRole(groupsClaim: unknown): AppRole | null {
  const groups = strings(groupsClaim);
  for (const [pattern, role] of ROLE_GROUPS) {
    if (groups.some((group) => pattern.test(group))) return role;
  }
  return null;
}

export function mapClaimsToKodamScope(claims: Record<string, unknown>): string[] {
  const explicit = strings(claims.kodam_scope ?? claims.kodamScope ?? claims.kodam);
  const fromGroups = strings(claims.groups)
    .map((group) => group.match(/(?:^|\/)kodam[-_/ ]([a-z0-9-]+)$/i)?.[1])
    .filter((code): code is string => Boolean(code));
  return [...new Set([...explicit, ...fromGroups].map(canonicalKodamScope))];
}
