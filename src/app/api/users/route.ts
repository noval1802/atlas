import { NextResponse } from "next/server";
import { authorize } from "@/auth/authorize";
import { getAuthPrincipal } from "@/auth/session";
import { authorizationError } from "@/http/api-response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const principal = await getAuthPrincipal();
  const access = authorize(principal, "user:read");
  if (!access.ok) return authorizationError(access);
  return NextResponse.json(
    await prisma.user.findMany({ include: { kodam: true }, orderBy: { name: "asc" }, take: 500 }),
  );
}
