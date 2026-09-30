import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { WebSocket, WebSocketServer } from "ws";

const resources = new Set(["incidents", "monitoring", "bangsit", "map-layouts", "map-points"]);
const actions = new Set(["create", "update", "delete", "reset"]);
const maximumBodyBytes = 16 * 1024;

function sameToken(actual, expected) {
  const actualBuffer = Buffer.from(actual ?? "");
  const expectedBuffer = Buffer.from(expected ?? "");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function json(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

async function readEvent(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maximumBodyBytes) throw new Error("PAYLOAD_TOO_LARGE");
    chunks.push(chunk);
  }
  const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!value || !resources.has(value.resource) || !actions.has(value.action)) {
    throw new Error("INVALID_EVENT");
  }
  return {
    type: "atlas.invalidate",
    resource: value.resource,
    action: value.action,
    id: typeof value.id === "string" ? value.id.slice(0, 160) : undefined,
    module: typeof value.module === "string" ? value.module.slice(0, 80) : undefined,
    timestamp: new Date().toISOString(),
  };
}

/**
 * @param {{ publishToken?: string, logger?: Pick<Console, "warn"> }} [options]
 */
export function createRealtimeServer({ publishToken, logger = console } = {}) {
  if (!publishToken) throw new Error("REALTIME_PUBLISH_TOKEN wajib dikonfigurasi");

  const webSockets = new WebSocketServer({ noServer: true, clientTracking: true });
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://realtime.internal");
    if (request.method === "GET" && url.pathname === "/health") {
      return json(response, 200, { status: "ok", clients: webSockets.clients.size });
    }
    if (request.method !== "POST" || url.pathname !== "/publish") {
      return json(response, 404, { error: "Not found" });
    }
    if (!sameToken(request.headers["x-atlas-realtime-token"], publishToken)) {
      return json(response, 401, { error: "Unauthorized" });
    }

    try {
      const event = await readEvent(request);
      const message = JSON.stringify(event);
      let delivered = 0;
      for (const client of webSockets.clients) {
        if (client.readyState !== WebSocket.OPEN) continue;
        client.send(message);
        delivered += 1;
      }
      return json(response, 202, { accepted: true, delivered });
    } catch (error) {
      const tooLarge = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE";
      return json(response, tooLarge ? 413 : 400, { error: "Invalid realtime event" });
    }
  });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "/", "http://realtime.internal");
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }
    webSockets.handleUpgrade(request, socket, head, (client) => {
      webSockets.emit("connection", client, request);
    });
  });

  webSockets.on("connection", (client) => {
    client.isAlive = true;
    client.on("pong", () => {
      client.isAlive = true;
    });
    client.send(JSON.stringify({ type: "atlas.ready", timestamp: new Date().toISOString() }));
  });

  const heartbeat = setInterval(() => {
    for (const client of webSockets.clients) {
      if (client.isAlive === false) {
        client.terminate();
        continue;
      }
      client.isAlive = false;
      client.ping();
    }
  }, 30_000);
  heartbeat.unref();

  server.on("close", () => {
    clearInterval(heartbeat);
    webSockets.close();
  });
  server.on("clientError", (error, socket) => {
    logger.warn?.("Realtime client error", error.message);
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  });

  return { server, webSockets };
}

export function startRealtimeServer() {
  const port = Number(process.env.PORT || 3001);
  const { server } = createRealtimeServer({ publishToken: process.env.REALTIME_PUBLISH_TOKEN });
  server.listen(port, "0.0.0.0", () => {
    console.log(`ATLAS realtime listening on 0.0.0.0:${port}`);
  });

  const shutdown = () => server.close(() => process.exit(0));
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startRealtimeServer();
}
