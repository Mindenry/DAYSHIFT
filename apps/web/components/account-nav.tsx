"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/returns", label: "Returns" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/loyalty", label: "Loyalty" },
  { href: "/account/support", label: "Customer care" },
  { href: "/account/settings", label: "Settings & security" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Account"
      className="grid grid-cols-2 gap-2 border-b border-line pb-5 lg:flex lg:flex-col lg:gap-0 lg:border-b-0 lg:pb-0"
    >
      {links.map((link) => {
        const active =
          link.href === "/account"
            ? pathname === "/account"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center border px-3 text-xs uppercase tracking-[0.08em] transition-colors lg:min-h-10 lg:border-0 lg:border-l-2 lg:px-0 lg:pl-4 lg:text-sm lg:normal-case lg:tracking-normal ${
              active
                ? "border-ink bg-ink text-paper lg:border-l-ink lg:bg-transparent lg:text-ink"
                : "border-line text-muted hover:border-ink hover:text-ink lg:border-line"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
