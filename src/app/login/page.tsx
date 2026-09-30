import { Suspense } from "react";
import { connection } from "next/server";
import { LoginClient } from "./login-client";

export default async function LoginPage() {
  await connection();

  const oidcEnabled = Boolean(
    process.env.OIDC_ISSUER && process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET,
  );
  const devLoginEnabled = process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_LOGIN === "true";
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" aria-label="Memuat halaman login" />}>
      <LoginClient oidcEnabled={oidcEnabled} devLoginEnabled={devLoginEnabled} />
    </Suspense>
  );
}
