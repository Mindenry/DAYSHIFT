"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Store } from "lucide-react";
import { Sidebar, MobileMenuButton } from "./sidebar";
import { CommandPalette } from "./command-palette";
import { NAV_GROUPS } from "./nav-items";
import { STOREFRONT_URL } from "@/lib/site";
import { LocaleSwitcher, useI18n } from "@/lib/i18n-client";

interface StaffUser {
  firstName: string;
  lastName: string;
  email: string;
  staffRole?: string;
  permissions: string[];
}

export function AdminShell({ user, children }: { user: StaffUser; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("ds_admin_sidebar") === "1");
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem("ds_admin_sidebar", next ? "1" : "0");
      return next;
    });
  };

  const current = useMemo(() => {
    const links = NAV_GROUPS.flatMap((group) => group.links);
    return links.find((link) => (link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(`${link.href}/`)));
  }, [pathname]);

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "DS";

  return (
    <div className={`min-h-screen transition-[padding] duration-300 ${collapsed ? "lg:pl-[76px]" : "lg:pl-[248px]"}`}>
      <Sidebar user={user} mobileOpen={open} onClose={() => setOpen(false)} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />

      <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <MobileMenuButton onClick={() => setOpen(true)} />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              {t("Commerce operations")}
            </p>
            <p className="truncate text-[13px] font-semibold text-ink">{current ? t(current.label) : t("Dashboard")}</p>
          </div>

          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="hidden h-9 min-w-[240px] items-center gap-2 rounded-lg border border-line bg-surface px-3 text-left text-xs text-muted shadow-sm transition-colors hover:border-line-strong md:flex xl:min-w-[320px]"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 truncate">{t("Search products, orders, customers…")}</span>
            <span className="kbd">⌘K</span>
          </button>
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted md:hidden"
            aria-label={t("Search")}
          >
            <Search className="h-4 w-4" />
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <LocaleSwitcher compact />
          </div>

          <a
            href={STOREFRONT_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted hover:text-ink xl:flex"
            aria-label={t("View store")}
            title={t("View store")}
          >
            <Store className="h-4 w-4" />
          </a>

          <Link
            href="/settings"
            className="flex h-9 items-center gap-2 rounded-full border border-line bg-surface pl-1 pr-3"
            title={user.email}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-surface">{initials}</span>
            <span className="hidden text-[11px] font-semibold text-ink-soft lg:inline">{user.firstName}</span>
          </Link>
        </div>
      </header>

      <main className="page-enter mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-8 lg:py-8">{children}</main>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} permissions={user.permissions} />
    </div>
  );
}
