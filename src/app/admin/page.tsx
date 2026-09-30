import { KeyRound, ScrollText, ShieldCheck, UserCog } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getAuthPrincipal } from "@/auth/session";
import { authorize } from "@/auth/authorize";
import { UserManager } from "@/components/admin/user-manager";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const principal = await getAuthPrincipal();
  if (!authorize(principal, "user:read").ok) redirect("/dashboard");
  const [activeUsers, roles, auditLogs, users, kodams] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.groupBy({ by: ["role"] }),
    prisma.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.user.findMany({ include: { kodam: true }, orderBy: { name: "asc" }, take: 500 }),
    prisma.kodam.findMany({ select: { code: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px] space-y-5">
        <PageHeader
          eyebrow="SYSTEM CONTROL"
          title="Administration"
          description="Role, pengguna, konfigurasi keamanan, dan audit aktivitas"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            [UserCog, String(activeUsers), "Pengguna Aktif"],
            [ShieldCheck, String(roles.length), "Role Digunakan"],
            [KeyRound, "8 jam", "Masa Sesi JWT"],
          ].map(([I, v, l]) => {
            const Icon = I as typeof UserCog;
            return (
              <div className="panel rounded-xl p-4" key={String(l)}>
                <Icon className="text-cyan-400" size={18} />
                <p className="mt-4 text-2xl font-semibold">{String(v)}</p>
                <p className="text-[10px] text-slate-500">{String(l)}</p>
              </div>
            );
          })}
        </div>
        <UserManager initialRows={users} kodams={kodams} canManage={authorize(principal, "user:manage").ok} />
        <section className="panel overflow-hidden rounded-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 p-4">
            <ScrollText size={15} className="text-cyan-400" />
            <h2 className="text-xs font-semibold tracking-wider">AUDIT LOG</h2>
          </div>
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-slate-800 text-[9px] text-slate-500">
                <th className="px-4 py-3">WAKTU</th>
                <th>PENGGUNA</th>
                <th>AKSI</th>
                <th>ENTITAS</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800/70">
                  <td className="px-4 py-4 font-mono text-cyan-400">
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "short",
                      timeStyle: "medium",
                      timeZone: "Asia/Jakarta",
                    }).format(log.createdAt)}
                  </td>
                  <td>{log.user?.name ?? log.user?.email ?? "Identity eksternal"}</td>
                  <td>
                    <span className="rounded bg-slate-800 px-2 py-1 text-[9px]">{log.action}</span>
                  </td>
                  <td className="text-slate-400">
                    {log.entity}
                    {log.entityId ? ` · ${log.entityId}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        {auditLogs.length === 0 && (
          <p className="text-center text-xs text-slate-500">Belum ada aktivitas audit.</p>
        )}
      </div>
    </AppShell>
  );
}
