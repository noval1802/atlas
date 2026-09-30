import { NextResponse } from "next/server";

type WindowEntry = { count: number; resetAt: number };
const windows = new Map<string, WindowEntry>();

function clientAddress(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function requestContext(request: Request) {
  return {
    ipAddress: clientAddress(request),
    userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    correlationId: request.headers.get("x-correlation-id")?.slice(0, 128) || crypto.randomUUID(),
  };
}

export function protectMutation(request: Request, limit = 60, windowMs = 60_000): NextResponse | null {
  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.NEXTAUTH_URL
    ? new URL(process.env.NEXTAUTH_URL).origin
    : requestOrigin;
  if (origin && origin !== requestOrigin && origin !== configuredOrigin) {
    return NextResponse.json({ error: "Origin request tidak diizinkan" }, { status: 403 });
  }

  const now = Date.now();
  const key = `${clientAddress(request)}:${new URL(request.url).pathname}`;
  const current = windows.get(key);
  const entry =
    !current || current.resetAt <= now
      ? { count: 1, resetAt: now + windowMs }
      : { ...current, count: current.count + 1 };
  windows.set(key, entry);

  if (windows.size > 2_000) {
    for (const [candidate, value] of windows) if (value.resetAt <= now) windows.delete(candidate);
  }
  if (entry.count > limit) {
    return NextResponse.json(
      { error: "Terlalu banyak request. Coba kembali sebentar lagi." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((entry.resetAt - now) / 1_000)) } },
    );
  }
  return null;
}

export async function readJsonBody(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; response: NextResponse }> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Content-Type harus application/json" }, { status: 415 }),
    };
  }
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false, response: NextResponse.json({ error: "JSON tidak valid" }, { status: 400 }) };
  }
}
