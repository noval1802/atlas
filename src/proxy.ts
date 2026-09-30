import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
export async function proxy(request: NextRequest) {
  // Public assets must stay directly readable by the Next Image optimizer.
  // Redirecting its internal fetch to the canonical host makes valid images
  // appear as an invalid/null resource.
  if (/\.[a-z0-9]+$/i.test(request.nextUrl.pathname)) return NextResponse.next();

  // Container health checks run against the loopback address. Keep this
  // endpoint local so the probe does not follow the canonical-host redirect.
  if (request.nextUrl.pathname === "/api/health") return NextResponse.next();

  const canonical = process.env.NEXTAUTH_URL;
  const canonicalUrl = canonical ? new URL(canonical) : null;
  if (canonicalUrl && request.headers.get("host") !== canonicalUrl.host) {
    return NextResponse.redirect(
      new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, canonicalUrl),
    );
  }
  if (request.nextUrl.pathname.startsWith("/api/") || request.nextUrl.pathname === "/login") {
    return NextResponse.next();
  }
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (token) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
