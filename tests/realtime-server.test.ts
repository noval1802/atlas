import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createRealtimeServer } from "../realtime/server.mjs";

test("server WebSocket menyiarkan event internal kepada browser", async (context) => {
  const { server } = createRealtimeServer({ publishToken: "token-test", logger: console });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
  context.after(async () => {
    socket.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const ready = JSON.parse(String((await once(socket, "message"))[0].data));
  assert.equal(ready.type, "atlas.ready");

  const message = once(socket, "message");
  const response = await fetch(`http://127.0.0.1:${address.port}/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Atlas-Realtime-Token": "token-test",
    },
    body: JSON.stringify({ resource: "monitoring", action: "update", module: "karhutla" }),
  });
  assert.equal(response.status, 202);
  assert.equal((await response.json()).delivered, 1);

  const event = JSON.parse(String((await message)[0].data));
  assert.equal(event.type, "atlas.invalidate");
  assert.equal(event.resource, "monitoring");
  assert.equal(event.module, "karhutla");
});

test("endpoint publish menolak token yang salah", async (context) => {
  const { server } = createRealtimeServer({ publishToken: "token-test", logger: console });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  context.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const response = await fetch(`http://127.0.0.1:${address.port}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Atlas-Realtime-Token": "salah" },
    body: JSON.stringify({ resource: "incidents", action: "create" }),
  });
  assert.equal(response.status, 401);
});
