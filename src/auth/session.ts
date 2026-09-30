import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import type { AuthPrincipal } from "./authorize";

export async function getAuthPrincipal(): Promise<AuthPrincipal | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    kodamScope: session.user.kodamScope ?? [],
  };
}
