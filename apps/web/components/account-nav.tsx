"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/returns", label: "Returns & exchanges" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/loyalty", label: "Loyalty" },
  { href: "/account/support", label: "Customer care" },
  { href: "/account/settings", label: "Settings & security" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="-mx-1 flex gap-1 overflow-x-auto lg:mx-0 lg:flex-col lg:overflow-visible">
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
            className={`shrink-0 border-b px-1 py-2.5 text-sm transition-colors lg:border-b-0 lg:border-l lg:pl-4 ${
              active ? "border-ink text-ink lg:border-ink" : "border-transparent text-muted hover:text-ink lg:border-line"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
