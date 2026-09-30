"use client";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <SessionProvider>
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <div className="min-w-0 flex-1">
          <Header />
          <main className="grid-pattern p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
