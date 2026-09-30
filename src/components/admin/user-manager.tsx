"use client";

import { useState } from "react";
import { Save, UserCog } from "lucide-react";

type KodamOption = { code: string; name: string };
type UserRow = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: string;
  status: string;
  lastLoginAt: Date | string | null;
  kodam: (KodamOption & { id?: string }) | null;
};
const roles = ["SUPER_ADMIN", "ADMIN", "OPERATOR_PUSDALOPS", "OPERATOR_KODAM", "ANALYST", "PIMPINAN"];

export function UserManager({
  initialRows,
  kodams,
  canManage,
}: {
  initialRows: UserRow[];
  kodams: KodamOption[];
  canManage: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [error, setError] = useState("");
  async function update(row: UserRow) {
    setError("");
    const response = await fetch(`/api/users/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: row.role === "ADMINISTRATOR" ? "ADMIN" : row.role,
        status: row.status,
        kodamCode: row.kodam?.code ?? null,
      }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error ?? "Akses pengguna gagal disimpan");
    setRows((current) => current.map((item) => (item.id === row.id ? data : item)));
  }
  function change(id: string, patch: Partial<UserRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }
  return (
    <section className="panel overflow-x-auto rounded-xl">
      <div className="flex items-center gap-2 border-b border-slate-800 p-4">
        <UserCog size={15} className="text-cyan-400" />
        <h2 className="text-xs font-semibold tracking-wider">MANAJEMEN AKSES PENGGUNA</h2>
      </div>
      {error && <p className="px-4 pt-3 text-xs text-rose-400">{error}</p>}
      <table className="w-full min-w-[900px] text-left text-[11px]">
        <thead>
          <tr className="border-b border-slate-800 text-[9px] text-slate-500">
            <th className="px-4 py-3">PENGGUNA</th>
            <th>ROLE</th>
            <th>KODAM</th>
            <th>STATUS</th>
            <th>LOGIN TERAKHIR</th>
            <th className="pr-4 text-right">AKSI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-800/70">
              <td className="px-4 py-3">
                <p className="font-medium">{row.name}</p>
                <small className="text-slate-500">
                  {row.username} · {row.email ?? "-"}
                </small>
              </td>
              <td>
                <select
                  disabled={!canManage}
                  value={row.role === "ADMINISTRATOR" ? "ADMIN" : row.role}
                  onChange={(event) => change(row.id, { role: event.target.value })}
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
                >
                  {roles.map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  disabled={!canManage || row.role !== "OPERATOR_KODAM"}
                  value={row.kodam?.code ?? ""}
                  onChange={(event) =>
                    change(row.id, {
                      kodam: kodams.find((kodam) => kodam.code === event.target.value) ?? null,
                    })
                  }
                  className="max-w-44 rounded border border-slate-700 bg-slate-950 px-2 py-1"
                >
                  <option value="">Nasional</option>
                  {kodams.map((kodam) => (
                    <option key={kodam.code} value={kodam.code}>
                      {kodam.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  disabled={!canManage}
                  value={row.status}
                  onChange={(event) => change(row.id, { status: event.target.value })}
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
                >
                  <option>ACTIVE</option>
                  <option>SUSPENDED</option>
                </select>
              </td>
              <td>
                {row.lastLoginAt
                  ? new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(
                      new Date(row.lastLoginAt),
                    )
                  : "-"}
              </td>
              <td className="pr-4 text-right">
                {canManage && (
                  <button onClick={() => update(row)} className="p-2 text-cyan-400" title="Simpan">
                    <Save size={14} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
