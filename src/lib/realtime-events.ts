export const realtimeResources = ["incidents", "monitoring", "bangsit", "map-layouts", "map-points"] as const;

export type RealtimeResource = (typeof realtimeResources)[number];
export type RealtimeAction = "create" | "update" | "delete" | "reset";

export type RealtimeInvalidation = {
  type: "atlas.invalidate";
  resource: RealtimeResource;
  action: RealtimeAction;
  id?: string;
  module?: string;
  timestamp: string;
};

export const realtimeBrowserEvent = "atlas:realtime-invalidation";

export function realtimeWebSocketUrl(location: Pick<Location, "protocol" | "host">) {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${location.host}/ws`;
}

export function parseRealtimeInvalidation(value: string): RealtimeInvalidation | null {
  try {
    const event = JSON.parse(value) as Partial<RealtimeInvalidation>;
    if (
      event.type !== "atlas.invalidate" ||
      !realtimeResources.includes(event.resource as RealtimeResource) ||
      !["create", "update", "delete", "reset"].includes(event.action ?? "") ||
      typeof event.timestamp !== "string"
    ) {
      return null;
    }
    return event as RealtimeInvalidation;
  } catch {
    return null;
  }
}
