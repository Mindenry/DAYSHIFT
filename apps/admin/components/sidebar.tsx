"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LogOut, Menu, Store, X } from "lucide-react";
import { clientApi } from "@/lib/api";
import { STOREFRONT_URL } from "@/lib/site";
import { LocaleSwitcher, useI18n } from "@/lib/i18n-client";
import { enumLabel } from "@/lib/messages";
import { NAV_GROUPS } from "./nav-items";

interface StaffUser {
  firstName: string;
  lastName: string;
  email: string;
  staffRole?: string;
  permissions: string[];
}

function initials(user: StaffUser) {
  return `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "DS";
}

export function Sidebar({
  user,
  mobileOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}: {
  user: StaffUser;
  mobileOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useI18n();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await clientApi("/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const nav = (compact: boolean) => (
    <div className="flex h-full flex-col">
      <div className={`flex h-16 shrink-0 items-center border-b border-sidebar-line ${compact ? "justify-center px-2" : "justify-between px-4"}`}>
        <Link href="/" className="flex items-center gap-2.5" aria-label={compact ? "DAYSHIFT" : undefined}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">D</span>
          {!compact && (
            <span className="leading-tight">
              <span className="block text-[12px] font-semibold tracking-[0.2em] text-white">DAYSHIFT</span>
              <span className="block text-[9px] uppercase tracking-[0.18em] text-white/50">{t("Ops")}</span>
            </span>
          )}
        </Link>
        {!compact && (
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white lg:hidden" aria-label={t("Close menu")}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-3" aria-label={t("Administration")}>
        {NAV_GROUPS.map((group) => {
          const links = group.links.filter((link) => user.permissions.includes(link.permission));
          if (!links.length) return null;
          return (
            <div key={group.title} className="mb-4">
              {!compact && (
                <p className="px-2.5 pb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/55">{t(group.title)}</p>
              )}
              <ul className="space-y-0.5">
                {links.map((link) => {
                  const active = link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(`${link.href}/`);
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        title={compact ? t(link.label) : undefined}
                        className={`group relative flex items-center rounded-lg text-[13px] font-medium transition-colors ${
                          compact ? "justify-center px-2 py-2.5" : "gap-2.5 px-2.5 py-[7px]"
                        } ${active ? "bg-accent text-white shadow-[0_4px_14px_rgba(47,107,79,0.35)]" : "text-white/65 hover:bg-white/8 hover:text-white"}`}
                      >
                        <Icon className="h-[17px] w-[17px] shrink-0" />
                        {!compact && <span className="truncate">{t(link.label)}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-line p-3">
        {compact ? (
          <div className="flex flex-col items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white" title={`${user.firstName} ${user.lastName}`}>
              {initials(user)}
            </span>
            <button type="button" onClick={signOut} disabled={signingOut} className="rounded-md p-2 text-white/65 hover:bg-white/10 hover:text-white" aria-label={t("Sign out")} title={t("Sign out")}>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            {mobileOpen && (
              <div className="mb-2 flex items-center justify-between gap-2 px-1 lg:hidden">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/55">{t("Language")}</span>
                <LocaleSwitcher compact />
              </div>
            )}
            <div className="flex items-center gap-2.5 rounded-lg bg-white/5 px-2.5 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">{initials(user)}</span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-white">{user.firstName} {user.lastName}</p>
                <p className="truncate text-[10px] text-white/60">{user.staffRole ? enumLabel(locale, user.staffRole) : user.email}</p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1">
              <a href={STOREFRONT_URL} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-medium text-white/65 hover:bg-white/10 hover:text-white">
                <Store className="h-3 w-3" /> {t("View store")}
              </a>
              <button type="button" onClick={signOut} disabled={signingOut} className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-medium text-white/65 hover:bg-white/10 hover:text-white">
                <LogOut className="h-3 w-3" /> {t("Sign out")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden bg-sidebar transition-[width] duration-300 lg:block ${
          collapsed ? "w-[76px]" : "w-[248px]"
        }`}
      >
        {nav(collapsed)}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -right-3 top-[74px] flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-line bg-sidebar-2 text-white/70 shadow-md hover:text-white"
          aria-label={collapsed ? t("Expand sidebar") : t("Collapse sidebar")}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("Navigation")}>
          <button type="button" className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" onClick={onClose} aria-label={t("Close menu")} />
          <div className="absolute inset-y-0 left-0 w-[280px] animate-[admin-drawer_260ms_cubic-bezier(0.22,1,0.36,1)] bg-sidebar shadow-2xl">
            {nav(false)}
          </div>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  const { t, locale } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink lg:hidden"
      aria-label={t("Open menu")}
    >
      <Menu className="h-4 w-4" />
    </button>
  );
}
