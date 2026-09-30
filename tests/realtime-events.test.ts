import assert from "node:assert/strict";
import test from "node:test";
import { parseRealtimeInvalidation, realtimeWebSocketUrl } from "../src/lib/realtime-events";

test("URL WebSocket mengikuti protokol halaman", () => {
  assert.equal(realtimeWebSocketUrl({ protocol: "https:", host: "atlas.example" }), "wss://atlas.example/ws");
  assert.equal(realtimeWebSocketUrl({ protocol: "http:", host: "localhost:3000" }), "ws://localhost:3000/ws");
});

test("event invalidasi realtime yang valid dapat dibaca", () => {
  const event = parseRealtimeInvalidation(
    JSON.stringify({
      type: "atlas.invalidate",
      resource: "monitoring",
      action: "update",
      module: "karhutla",
      timestamp: "2026-08-26T14:00:00.000Z",
    }),
  );
  assert.equal(event?.resource, "monitoring");
  assert.equal(event?.module, "karhutla");
});

test("payload WebSocket yang tidak dikenal ditolak", () => {
  assert.equal(parseRealtimeInvalidation("bukan-json"), null);
  assert.equal(
    parseRealtimeInvalidation(
      JSON.stringify({
        type: "atlas.invalidate",
        resource: "rahasia",
        action: "update",
        timestamp: "2026-08-26T14:00:00.000Z",
      }),
    ),
    null,
  );
});
