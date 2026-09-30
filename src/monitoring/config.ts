import type { Permission } from "@/auth/permissions";

export const MONITORING_MODULES = ["bencana", "karhutla", "unras", "security", "resources"] as const;
export type MonitoringModule = (typeof MONITORING_MODULES)[number];

export function isMonitoringModule(value: string): value is MonitoringModule {
  return MONITORING_MODULES.includes(value as MonitoringModule);
}

export const monitoringPermissions: Record<MonitoringModule, { read: Permission; write: Permission }> = {
  bencana: { read: "bencana:read", write: "bencana:write" },
  karhutla: { read: "karhutla:read", write: "karhutla:write" },
  unras: { read: "unras:read", write: "unras:write" },
  security: { read: "security:read", write: "security:write" },
  resources: { read: "resources:read", write: "resources:write" },
};
