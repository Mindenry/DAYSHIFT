"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import { NAV_GROUPS, QUICK_LINKS, type NavLink } from "./nav-items";
import { useI18n } from "@/lib/i18n-client";

export function CommandPalette({
  open,
  onClose,
  permissions,
}: {
  open: boolean;
  onClose: () => void;
  permissions: string[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => {
    const allowed = (link: NavLink) => permissions.includes(link.permission);
    return [
      {
        title: "Quick actions",
        links: QUICK_LINKS.filter(allowed),
      },
      ...NAV_GROUPS.map((group) => ({
        title: group.title,
        links: group.links.filter(allowed),
      })),
    ].filter((group) => group.links.length > 0);
  }, [permissions]);

  const flat = useMemo(() => groups.flatMap((group) => group.links), [groups]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return flat;
    return flat.filter((link) => {
      const label = t(link.label).toLowerCase();
      return label.includes(needle) || link.label.toLowerCase().includes(needle) || link.href.toLowerCase().includes(needle);
    });
  }, [flat, query, t]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const timer = setTimeout(() => inputRef.current?.focus(), 40);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((current) => Math.min(filtered.length - 1, current + 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((current) => Math.max(0, current - 1));
      }
      if (event.key === "Enter" && filtered[active]) {
        event.preventDefault();
        router.push(filtered[active].href);
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, active, onClose, router]);

  if (!open) return null;

  const go = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/45 p-4 pt-[12vh] backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={t("Command menu")}>
      <button type="button" className="absolute inset-0 cursor-default" aria-label={t("Close")} onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_30px_90px_rgba(15,20,17,0.28)]">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Search anything…")}
            className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted/70"
            aria-label={t("Search")}
          />
          <button type="button" onClick={onClose} className="a-btn a-btn-ghost a-btn-icon" aria-label={t("Close")}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">{t("No matching results")}</p>
          ) : (
            groups.map((group) => {
              const links = group.links.filter((link) => filtered.includes(link));
              if (!links.length) return null;
              return (
                <div key={group.title} className="mb-2">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{t(group.title)}</p>
                  {links.map((link) => {
                    const index = filtered.indexOf(link);
                    const Icon = link.icon;
                    return (
                      <button
                        key={link.href}
                        type="button"
                        onMouseEnter={() => setActive(index)}
                        onClick={() => go(link.href)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                          index === active ? "bg-accent-soft text-accent" : "text-ink-soft hover:bg-surface-2"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{t(link.label)}</span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-50" />
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-between border-t border-line bg-surface-2 px-4 py-2 text-[10px] text-muted">
          <span>{t("Use ↑ ↓ to move, Enter to open")}</span>
          <span className="kbd">Esc</span>
        </div>
      </div>
    </div>
  );
}
