"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, User, X, Heart } from "lucide-react";
import type { CategorySummary } from "@dayshift/types";
import { CartBadge } from "./cart-badge";
import { SearchOverlay } from "./search-overlay";
import { MobileMenu } from "./mobile-menu";

export function SiteHeaderClient({
  roots,
  user,
}: {
  roots: CategorySummary[];
  user: { firstName: string } | null;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mega, setMega] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMega(null);
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMega(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const primary = roots.slice(0, 6);
  const activeRoot = roots.find((root) => root.slug === mega);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
      <div className="wrap">
        <div className="flex h-16 items-center justify-between gap-4 md:h-20">
          <nav aria-label="Primary" className="hidden flex-1 items-center gap-6 lg:flex">
            {primary.map((root) => (
              <div
                key={root.slug}
                onMouseEnter={() => setMega(root.slug)}
                onMouseLeave={() => setMega(null)}
                onFocus={() => setMega(root.slug)}
              >
                <Link
                  href={`/c/${root.slug}`}
                  className="overline link-underline inline-flex h-20 items-center !text-[10.5px] !tracking-[0.18em]"
                  aria-haspopup={root.children?.length ? "true" : undefined}
                  aria-expanded={mega === root.slug}
                >
                  {root.name}
                </Link>
              </div>
            ))}
            <Link href="/collections/new-arrivals" className="overline link-underline !text-[10.5px] !tracking-[0.18em]">
              New
            </Link>
            <Link href="/collections/sale" className="overline link-underline !text-[10.5px] !tracking-[0.18em] text-sale">
              Sale
            </Link>
          </nav>

          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            href="/"
            className="shrink-0 whitespace-nowrap font-display text-[20px] tracking-[0.16em] min-[380px]:text-[24px] sm:text-[27px] md:text-[30px]"
            aria-label="DAYSHIFT home"
          >
            DAYSHIFT
          </Link>

          <div className="flex flex-1 shrink-0 items-center justify-end gap-0 sm:gap-1 md:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-11 w-10 items-center justify-center transition-opacity hover:opacity-60 sm:w-11"
              aria-label="Search"
            >
              <Search className="h-[19px] w-[19px]" />
            </button>
            <Link
              href={user ? "/account" : "/login"}
              className="hidden h-11 w-11 items-center justify-center transition-opacity hover:opacity-60 min-[420px]:inline-flex"
              aria-label={user ? "Your account" : "Sign in"}
            >
              <User className="h-[19px] w-[19px]" />
            </Link>
            <Link
              href="/account/wishlist"
              className="hidden h-11 w-11 items-center justify-center transition-opacity hover:opacity-60 sm:inline-flex"
              aria-label="Wishlist"
            >
              <Heart className="h-[19px] w-[19px]" />
            </Link>
            <Link
              href="/cart"
              className="relative inline-flex h-11 w-10 items-center justify-center transition-opacity hover:opacity-60 sm:w-11"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="h-[19px] w-[19px]" />
              <CartBadge />
            </Link>
          </div>
        </div>
      </div>

      {activeRoot && (activeRoot.children?.length ?? 0) > 0 && (
        <div
          className="absolute inset-x-0 top-full hidden border-b border-line bg-paper lg:block"
          onMouseEnter={() => setMega(activeRoot.slug)}
          onMouseLeave={() => setMega(null)}
        >
          <div className="wrap grid grid-cols-[1fr_1.1fr] gap-16 py-10">
            <div>
              <p className="overline text-muted">{activeRoot.name}</p>
              <div className="mt-5 grid grid-cols-2 gap-x-10 gap-y-2">
                {activeRoot.children?.map((child) => (
                  <Link
                    key={child.slug}
                    href={`/c/${child.slug}`}
                    className="link-underline w-fit py-1 font-display text-xl"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
              <div className="mt-8 flex gap-8">
                <Link href={`/c/${activeRoot.slug}`} className="overline link-underline">
                  Shop all {activeRoot.name}
                </Link>
                <Link href="/collections/new-arrivals" className="overline link-underline text-muted">
                  New arrivals
                </Link>
              </div>
            </div>
            {activeRoot.imageUrl && (
              <Link href={`/c/${activeRoot.slug}`} className="group relative block aspect-[16/8] overflow-hidden bg-sand">
                { }
                <img
                  src={activeRoot.imageUrl}
                  alt={activeRoot.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <span className="absolute bottom-5 left-5 bg-paper/90 px-4 py-2 text-[11px] uppercase tracking-[0.18em]">
                  The {activeRoot.name} edit
                </span>
              </Link>
            )}
          </div>
        </div>
      )}

      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} roots={roots} user={user} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
