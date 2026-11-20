"use client";

import { useEffect } from "react";
import { X, Search } from "lucide-react";
import Link from "next/link";import type { CategorySummary } from "@dayshift/types";

interface Props {
  open: boolean;
  onClose: () => void;
  roots: CategorySummary[];
  user: { firstName: string } | null;
}

export function MobileMenu({ open, onClose, roots, user }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-paper lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="flex h-16 items-center justify-between border-b border-line px-5">
        <span className="font-display text-2xl tracking-[0.18em]">DAYSHIFT</span>
        <button type="button" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="h-[calc(100%-64px)] overflow-y-auto px-5 pb-16">
        <nav aria-label="Mobile primary" className="divide-y divide-line">
          {roots.map((root) => (
            <details key={root.slug} className="group">
              <summary className="flex list-none items-center justify-between py-5 font-display text-3xl">
                {root.name}
                <span className="text-lg text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pb-5">
                <Link href={`/c/${root.slug}`} onClick={onClose} className="py-1 text-sm uppercase tracking-[0.14em]">
                  Shop all
                </Link>
                {root.children?.map((child) => (
                  <Link key={child.slug} href={`/c/${child.slug}`} onClick={onClose} className="py-1 text-sm text-muted">
                    {child.name}
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </nav>
        <div className="mt-8 grid gap-2">
          <Link href="/collections/new-arrivals" onClick={onClose} className="py-2 font-display text-2xl">New arrivals</Link>
          <Link href="/collections/best-sellers" onClick={onClose} className="py-2 font-display text-2xl">Best sellers</Link>
          <Link href="/collections/sale" onClick={onClose} className="py-2 font-display text-2xl text-sale">Sale</Link>
        </div>
        <div className="mt-10 border-t border-line pt-6">
          <Link
            href="/search"
            onClick={onClose}
            className="flex w-full items-center gap-3 py-3 text-left text-sm uppercase tracking-[0.14em]"
          >
            <Search className="h-4 w-4" /> Search
          </Link>
          <Link href={user ? "/account" : "/login"} onClick={onClose} className="block py-3 text-sm uppercase tracking-[0.14em]">
            {user ? `Account — ${user.firstName}` : "Sign in / register"}
          </Link>
          <Link href="/account/wishlist" onClick={onClose} className="block py-3 text-sm uppercase tracking-[0.14em]">
            Wishlist
          </Link>
          <Link href="/cart" onClick={onClose} className="block py-3 text-sm uppercase tracking-[0.14em]">
            Shopping bag
          </Link>
          <Link href="/support" onClick={onClose} className="block py-3 text-sm uppercase tracking-[0.14em]">
            Customer care
          </Link>
        </div>
      </div>
    </div>
  );
}
