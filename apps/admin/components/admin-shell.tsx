"use client";

import { useState } from "react";
import { Sidebar, MobileMenuButton } from "./sidebar";

export function AdminShell({
  user,
  children,
}: {
  user: { firstName: string; lastName: string; email: string; staffRole?: string; permissions: string[] };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:pl-60">
      <Sidebar user={user} mobileOpen={open} onClose={() => setOpen(false)} />
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur lg:px-8">
        <div className="flex items-center gap-3">
          <MobileMenuButton onClick={() => setOpen(true)} />
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
            Commerce operations <span className="mx-2 text-line">/</span>
            <span className="text-ink">Live</span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-muted">Sandbox</span>
          </span>
          <span className="hidden text-muted md:inline">{user.email}</span>
        </div>
      </header>
      <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
