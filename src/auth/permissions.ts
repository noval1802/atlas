import type { AppRole } from "./roles";

export const PERMISSIONS = [
  "dashboard:read",
  "incident:read",
  "incident:create",
  "incident:update",
  "incident:delete",
  "bencana:read",
  "bencana:write",
  "karhutla:read",
  "karhutla:write",
  "unras:read",
  "unras:write",
  "security:read",
  "security:write",
  "resources:read",
  "resources:write",
  "map:read",
  "map:write",
  "alert:read",
  "alert:write",
  "kodam:read",
  "kodam:create",
  "kodam:delete",
  "kodam:update",
  "kodam:reset",
  "report:read",
  "report:create",
  "report:update",
  "report:delete",
  "report:export",
  "document:read",
  "document:upload",
  "bangsit:read",
  "bangsit:create",
  "bangsit:export",
  "user:read",
  "user:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const READ_ONLY: Permission[] = [
  "dashboard:read",
  "incident:read",
  "bencana:read",
  "karhutla:read",
  "unras:read",
  "security:read",
  "resources:read",
  "map:read",
  "alert:read",
  "kodam:read",
  "report:read",
  "document:read",
  "bangsit:read",
  "bangsit:export",
];

const OPERATIONAL: Permission[] = [
  ...READ_ONLY,
  "incident:create",
  "incident:update",
  "incident:delete",
  "bencana:write",
  "karhutla:write",
  "unras:write",
  "security:write",
  "resources:write",
  "map:write",
  "alert:write",
  "kodam:update",
  "report:create",
  "report:update",
  "report:export",
  "document:upload",
  "bangsit:create",
];

export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[] | "*"> = {
  SUPER_ADMIN: "*",
  ADMIN: "*",
  OPERATOR_PUSDALOPS: OPERATIONAL,
  OPERATOR_KODAM: OPERATIONAL,
  ANALYST: [...READ_ONLY, "report:export"],
  PIMPINAN: READ_ONLY,
};

export function hasPermission(role: AppRole, permission: Permission): boolean {
  const granted = ROLE_PERMISSIONS[role];
  return granted === "*" || granted.includes(permission);
}
