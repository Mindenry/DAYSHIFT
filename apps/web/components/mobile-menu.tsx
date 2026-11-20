"use client";

import { useEffect, useRef } from "react";
import { X, Search } from "lucide-react";
import Link from "next/link";
import type { CategorySummary } from "@dayshift/types";
import { usePresence } from "./use-presence";

interface Props {
  open: boolean;
  onClose: () => void;
  roots: CategorySummary[];
  user: { firstName: string } | null;
}

export function MobileMenu({ open, onClose, roots, user }: Props) {
  const { mounted, state } = usePresence(open, 260);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => closeRef.current?.focus(), 260);
    return () => {
      document.body.style.overflow = "";
      clearTimeout(timer);
    };
  }, [open]);

  if (!mounted) return null;
  const isOpen = state === "open";

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!isOpen}>
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className={`absolute inset-0 bg-ink/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`relative flex h-full w-[86%] max-w-[360px] flex-col bg-paper shadow-[0_0_70px_rgba(0,0,0,0.28)] transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <span className="font-display text-2xl tracking-[0.18em]">DAYSHIFT</span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center transition-transform duration-150 active:scale-90"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-16">
          <nav aria-label="Mobile primary" className="divide-y divide-line">
            {roots.map((root, index) => (
              <details
                key={root.slug}
                className="group menu-item"
                style={{ "--i": `${40 + index * 30}ms` } as React.CSSProperties}
              >
                <summary className="flex min-h-14 list-none items-center justify-between py-4 font-display text-3xl transition-colors active:text-ink/60">
                  {root.name}
                  <span className="text-lg text-muted transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pb-4">
                  <Link
                    href={`/c/${root.slug}`}
                    onClick={onClose}
                    className="flex min-h-10 items-center text-sm uppercase tracking-[0.14em]"
                  >
                    Shop all
                  </Link>
                  {root.children?.map((child) => (
                    <Link
                      key={child.slug}
                      href={`/c/${child.slug}`}
                      onClick={onClose}
                      className="flex min-h-10 items-center text-sm text-muted"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </nav>

          <div className="mt-6 grid gap-1">
            {[
              { href: "/collections/new-arrivals", label: "New arrivals" },
              { href: "/collections/best-sellers", label: "Best sellers" },
              { href: "/collections/sale", label: "Sale", sale: true },
            ].map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`menu-item flex min-h-12 items-center font-display text-2xl ${item.sale ? "text-sale" : ""}`}
                style={{ "--i": `${40 + (roots.length + index) * 30}ms` } as React.CSSProperties}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div
            className="menu-item mt-8 border-t border-line pt-4"
            style={{ "--i": `${40 + (roots.length + 3) * 30}ms` } as React.CSSProperties}
          >
            <Link
              href="/search"
              onClick={onClose}
              className="flex min-h-11 w-full items-center gap-3 text-left text-sm uppercase tracking-[0.14em]"
            >
              <Search className="h-4 w-4" /> Search
            </Link>
            <Link
              href={user ? "/account" : "/login"}
              onClick={onClose}
              className="flex min-h-11 items-center text-sm uppercase tracking-[0.14em]"
            >
              {user ? `Account — ${user.firstName}` : "Sign in / register"}
            </Link>
            <Link
              href="/account/wishlist"
              onClick={onClose}
              className="flex min-h-11 items-center text-sm uppercase tracking-[0.14em]"
            >
              Wishlist
            </Link>
            <Link
              href="/cart"
              onClick={onClose}
              className="flex min-h-11 items-center text-sm uppercase tracking-[0.14em]"
            >
              Shopping bag
            </Link>
            <Link
              href="/support"
              onClick={onClose}
              className="flex min-h-11 items-center text-sm uppercase tracking-[0.14em]"
            >
              Customer care
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
