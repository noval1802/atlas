import "server-only";
import type { RealtimeAction, RealtimeResource } from "@/lib/realtime-events";

type PublishEvent = {
  resource: RealtimeResource;
  action: RealtimeAction;
  id?: string;
  module?: string;
};

export async function publishRealtimeEvent(event: PublishEvent) {
  const url = process.env.REALTIME_INTERNAL_URL;
  const token = process.env.REALTIME_PUBLISH_TOKEN;
  if (!url || !token) return false;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Atlas-Realtime-Token": token,
      },
      body: JSON.stringify(event),
      cache: "no-store",
      signal: AbortSignal.timeout(2_000),
    });
    if (!response.ok) console.warn(`Realtime publish ditolak (${response.status})`);
    return response.ok;
  } catch (error) {
    console.warn("Realtime publish tidak tersedia", error instanceof Error ? error.message : error);
    return false;
  }
}
