"use client";
import { Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, User } from "lucide-react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginClient({
  oidcEnabled,
  devLoginEnabled,
}: {
  oidcEnabled: boolean;
  devLoginEnabled: boolean;
}) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState<"user" | "admin" | "development" | null>(null);
  const [error, setError] = useState("");
  const requestedCallbackUrl = useSearchParams().get("callbackUrl");
  const callbackUrl =
    requestedCallbackUrl?.startsWith("/") && !requestedCallbackUrl.startsWith("//")
      ? requestedCallbackUrl
      : "/dashboard";
  const userCallbackUrl = callbackUrl.startsWith("/admin") ? "/dashboard" : callbackUrl;

  function ssoLogin(access: "user" | "admin") {
    setLoading(access);
    setError("");
    void signIn("oidc", { callbackUrl: access === "admin" ? "/admin" : userCallbackUrl });
  }

  async function developmentLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("development");
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await signIn("dev-credentials", {
      username: form.get("username"),
      password: form.get("password"),
      callbackUrl,
      redirect: false,
    });
    setLoading(null);
    if (result?.ok) window.location.assign(result.url ?? callbackUrl);
    else setError("Username atau password development tidak valid.");
  }
  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#060b16] lg:grid-cols-[1.1fr_.9fr]">
      <section className="grid-pattern relative hidden overflow-hidden border-r border-slate-800 p-16 lg:flex lg:flex-col lg:justify-between">
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-xl font-bold text-cyan-300">
            A
          </span>
          <div>
            <p className="text-2xl font-bold tracking-[.28em]">ATLAS</p>
            <p className="text-[9px] tracking-[.16em] text-slate-500">COMMAND CENTER</p>
          </div>
        </div>
        <div className="relative max-w-xl">
          <p className="text-xs font-semibold tracking-[.22em] text-cyan-400">
            INTEGRATED SITUATIONAL AWARENESS
          </p>
          <h1 className="mt-5 text-4xl font-light leading-tight text-slate-100 xl:text-5xl">
            Satu identitas.
            <br />
            <span className="font-semibold">Akses terkendali.</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-slate-500">
            Masuk melalui penyedia identitas terpusat. Hak akses ATLAS ditentukan oleh role dan cakupan Kodam
            Anda.
          </p>
        </div>
        <p className="relative text-[9px] tracking-wider text-slate-600">
          ADVANCED TACTICAL LOCATION & ANALYTICS SYSTEM • 2026
        </p>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400">
              <ShieldCheck size={21} />
            </span>
            <h2 className="text-2xl font-semibold">Akses Command Center</h2>
            <p className="mt-2 text-xs text-slate-500">Gunakan akun organisasi Anda untuk melanjutkan.</p>
          </div>
          {oidcEnabled ? (
            <div className="space-y-3">
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => ssoLogin("user")}
                className="group flex w-full items-center gap-4 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-left transition hover:border-cyan-300/60 hover:bg-cyan-400/15 disabled:cursor-wait disabled:opacity-60"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
                  <User size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold tracking-[.08em] text-cyan-100">
                    {loading === "user" ? "MENGALIHKAN..." : "PENGGUNA OPERASIONAL"}
                  </span>
                  <span className="mt-1 block text-[10px] leading-4 text-slate-400">
                    Operator, analis, dan pimpinan
                  </span>
                </span>
                <KeyRound size={15} className="text-cyan-400 transition group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                disabled={loading !== null}
                onClick={() => ssoLogin("admin")}
                className="group flex w-full items-center gap-4 rounded-xl border border-amber-400/25 bg-amber-400/5 p-4 text-left transition hover:border-amber-300/50 hover:bg-amber-400/10 disabled:cursor-wait disabled:opacity-60"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-400/10 text-amber-300">
                  <ShieldCheck size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold tracking-[.08em] text-amber-100">
                    {loading === "admin" ? "MENGALIHKAN..." : "ADMINISTRATOR ATLAS"}
                  </span>
                  <span className="mt-1 block text-[10px] leading-4 text-slate-400">
                    Khusus role Admin dan Super Admin
                  </span>
                </span>
                <KeyRound size={15} className="text-amber-300 transition group-hover:translate-x-0.5" />
              </button>

              <p className="px-1 text-[10px] leading-4 text-slate-600">
                Keduanya memakai akun SSO organisasi. Hak akses tetap diverifikasi berdasarkan role akun.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-xs leading-5 text-amber-200">
              SSO belum dikonfigurasi. Administrator perlu mengisi variabel OIDC.
            </div>
          )}
          {devLoginEnabled && (
            <>
              <div className="my-6 flex items-center gap-3 text-[9px] tracking-widest text-slate-600">
                <span className="h-px flex-1 bg-slate-800" />
                DEVELOPMENT ONLY
                <span className="h-px flex-1 bg-slate-800" />
              </div>
              <form onSubmit={developmentLogin} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[10px] text-slate-400">USERNAME</span>
                  <span className="flex items-center rounded-lg border border-slate-700 bg-[#0b1424] px-3">
                    <User size={15} className="text-slate-500" />
                    <input
                      name="username"
                      required
                      autoComplete="username"
                      className="h-11 w-full bg-transparent px-3 text-sm outline-none"
                    />
                  </span>
                </label>
                <label className="block">
                  <span className="mb-2 block text-[10px] text-slate-400">PASSWORD</span>
                  <span className="flex items-center rounded-lg border border-slate-700 bg-[#0b1424] px-3">
                    <LockKeyhole size={15} className="text-slate-500" />
                    <input
                      name="password"
                      required
                      autoComplete="current-password"
                      type={show ? "text" : "password"}
                      className="h-11 w-full bg-transparent px-3 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      aria-label="Tampilkan password"
                      className="text-slate-500"
                    >
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </span>
                </label>
                {error && (
                  <p role="alert" className="text-xs text-rose-400">
                    {error}
                  </p>
                )}
                <button
                  disabled={loading !== null}
                  className="h-11 w-full rounded-lg border border-cyan-500/50 text-xs font-bold tracking-[.1em] text-cyan-300 disabled:opacity-60"
                >
                  {loading === "development" ? "MENGAUTENTIKASI..." : "LOGIN DEVELOPMENT"}
                </button>
              </form>
            </>
          )}
          <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-800 pt-6 text-[9px] tracking-wide text-slate-600">
            <LockKeyhole size={11} /> OIDC • PKCE • SERVER-SIDE AUTHORIZATION
          </div>
        </div>
      </section>
    </main>
  );
}
