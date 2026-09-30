import type { NextAuthOptions, Profile } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { OAuthConfig } from "next-auth/providers/oauth";
import { isAppRole, type AppRole } from "./roles";
import { syncIdentityUser } from "./user-directory";

type AtlasProfile = Profile & Record<string, unknown>;

function oidcProvider(): OAuthConfig<AtlasProfile> | null {
  const issuer = process.env.OIDC_ISSUER?.replace(/\/$/, "");
  const clientId = process.env.OIDC_CLIENT_ID;
  const clientSecret = process.env.OIDC_CLIENT_SECRET;
  if (!issuer || !clientId || !clientSecret) return null;

  return {
    id: "oidc",
    name: process.env.OIDC_PROVIDER_NAME ?? "SSO Terpusat",
    type: "oauth",
    wellKnown: `${issuer}/.well-known/openid-configuration`,
    clientId,
    clientSecret,
    idToken: true,
    checks: ["pkce", "state"],
    authorization: { params: { scope: "openid profile email" } },
    profile(profile: AtlasProfile) {
      if (typeof profile.sub !== "string" || !profile.sub) throw new Error("OIDC subject claim is required");
      const displayName =
        typeof profile.name === "string"
          ? profile.name
          : typeof profile.preferred_username === "string"
            ? profile.preferred_username
            : profile.sub;
      return {
        id: profile.sub,
        name: displayName,
        email: typeof profile.email === "string" ? profile.email : null,
        image: null,
      };
    },
  };
}

function devProvider() {
  const enabled = process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_LOGIN === "true";
  if (!enabled) return null;
  return CredentialsProvider({
    id: "dev-credentials",
    name: "Development Login",
    credentials: {
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const expectedUsername = process.env.DEV_LOGIN_USERNAME;
      const expectedPassword = process.env.DEV_LOGIN_PASSWORD;
      if (!expectedUsername || !expectedPassword) return null;
      if (credentials?.username !== expectedUsername || credentials.password !== expectedPassword)
        return null;
      return {
        id: "development-admin",
        name: "Admin Pusdalops",
        email: "admin@atlas.local",
        role: "ADMIN" as AppRole,
        kodamScope: [],
      };
    },
  });
}

const providers = [oidcProvider(), devProvider()].filter(Boolean) as NextAuthOptions["providers"];

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  providers,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ profile }) {
      if (!profile) return true;
      const directoryUser = await syncIdentityUser(profile as AtlasProfile);
      return directoryUser.status === "ACTIVE";
    },
    async jwt({ token, user, profile }) {
      if (profile) {
        const claims = profile as AtlasProfile;
        const directoryUser = await syncIdentityUser(claims);
        token.externalIdentityId = String(claims.sub);
        token.role = directoryUser.role;
        token.kodamScope = directoryUser.kodamScope;
      }
      if (user) {
        const candidate = user as typeof user & { role?: unknown; kodamScope?: unknown };
        if (isAppRole(candidate.role)) token.role = candidate.role;
        if (Array.isArray(candidate.kodamScope)) token.kodamScope = candidate.kodamScope;
      }
      if (!isAppRole(token.role)) token.role = "PIMPINAN";
      if (!Array.isArray(token.kodamScope)) token.kodamScope = [];
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.externalIdentityId =
        typeof token.externalIdentityId === "string" ? token.externalIdentityId : undefined;
      session.user.role = isAppRole(token.role) ? token.role : "PIMPINAN";
      session.user.kodamScope = Array.isArray(token.kodamScope)
        ? token.kodamScope.filter((code): code is string => typeof code === "string")
        : [];
      return session;
    },
  },
};
