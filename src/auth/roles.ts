export const APP_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "OPERATOR_PUSDALOPS",
  "OPERATOR_KODAM",
  "ANALYST",
  "PIMPINAN",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && APP_ROLES.includes(value as AppRole);
}
