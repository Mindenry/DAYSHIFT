"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Package, FolderTree, Layers, Tag, ShoppingCart, RotateCcw,
  Boxes, Warehouse, Truck, Users, Ticket, Star, TicketPercent, Megaphone,
  Gift, FileText, UserCog, ShieldCheck, ScrollText, Settings, Activity,
  Store, LogOut, Menu, X, ClipboardList,
} from "lucide-react";
import { clientApi } from "@/lib/api";

interface LinkItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
}

const GROUPS: Array<{ title: string; links: LinkItem[] }> = [
  {
    title: "Overview",
    links: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.read" },
      { href: "/reports", label: "Reports", icon: FileText, permission: "reports.read" },
    ],
  },
  {
    title: "Catalog",
    links: [
      { href: "/products", label: "Products", icon: Package, permission: "products.read" },
      { href: "/categories", label: "Categories", icon: FolderTree, permission: "products.read" },
      { href: "/collections", label: "Collections", icon: Layers, permission: "products.read" },
      { href: "/brands", label: "Brands", icon: Tag, permission: "products.read" },
    ],
  },
  {
    title: "Sales",
    links: [
      { href: "/orders", label: "Orders", icon: ShoppingCart, permission: "orders.read" },
      { href: "/returns", label: "Returns & refunds", icon: RotateCcw, permission: "returns.read" },
    ],
  },
  {
    title: "Inventory",
    links: [
      { href: "/inventory", label: "Stock", icon: Boxes, permission: "inventory.read" },
      { href: "/warehouses", label: "Warehouses", icon: Warehouse, permission: "inventory.read" },
      { href: "/suppliers", label: "Suppliers", icon: Store, permission: "suppliers.manage" },
      { href: "/purchase-orders", label: "Purchase orders", icon: ClipboardList, permission: "purchase_orders.manage" },
    ],
  },
  {
    title: "Customers",
    links: [
      { href: "/customers", label: "Customers", icon: Users, permission: "customers.read" },
      { href: "/tickets", label: "Support", icon: Ticket, permission: "tickets.read" },
      { href: "/reviews", label: "Reviews", icon: Star, permission: "reviews.moderate" },
    ],
  },
  {
    title: "Marketing",
    links: [
      { href: "/coupons", label: "Coupons", icon: TicketPercent, permission: "marketing.manage" },
      { href: "/promotions", label: "Promotions", icon: Megaphone, permission: "marketing.manage" },
      { href: "/loyalty", label: "Loyalty", icon: Gift, permission: "loyalty.manage" },
    ],
  },
  {
    title: "Administration",
    links: [
      { href: "/staff", label: "Staff", icon: UserCog, permission: "staff.manage" },
      { href: "/roles", label: "Roles & permissions", icon: ShieldCheck, permission: "roles.manage" },
      { href: "/audit", label: "Audit log", icon: ScrollText, permission: "audit.read" },
      { href: "/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
      { href: "/system", label: "System health", icon: Activity, permission: "system.read" },
    ],
  },
];

export function Sidebar({
  user,
  mobileOpen,
  onClose,
}: {
  user: { firstName: string; lastName: string; email: string; staffRole?: string; permissions: string[] };
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-sidebar-line px-5">
        <Link href="/" className="text-sm font-semibold tracking-[0.28em] text-paper">DAYSHIFT</Link>
        <span className="rounded-sm border border-sidebar-line px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-paper/50">Ops</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Administration">
        {GROUPS.map((group) => {
          const links = group.links.filter((link) => user.permissions.includes(link.permission));
          if (!links.length) return null;
          return (
            <div key={group.title} className="mb-5">
              <p className="px-2 pb-2 text-[9px] uppercase tracking-[0.16em] text-paper/35">{group.title}</p>
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
                        className={`flex items-center gap-2.5 rounded-sm px-2 py-2 text-[13px] transition-colors ${
                          active ? "bg-paper text-ink" : "text-paper/70 hover:bg-sidebar-line hover:text-paper"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-line p-4">
        <p className="truncate text-xs text-paper">{user.firstName} {user.lastName}</p>
        <p className="truncate text-[10px] text-paper/40">{user.staffRole?.replace(/_/g, " ").toLowerCase()}</p>
        <div className="mt-3 flex items-center justify-between">
          <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="text-[10px] uppercase tracking-[0.12em] text-paper/50 hover:text-paper">
            View store
          </a>
          <button
            type="button"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              try {
                await clientApi("/auth/logout", { method: "POST" });
              } finally {
                router.push("/login");
                router.refresh();
              }
            }}
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-paper/50 hover:text-paper"
          >
            <LogOut className="h-3 w-3" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 bg-sidebar lg:block">{nav}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
          <div className="absolute inset-y-0 left-0 w-64 bg-sidebar">
            <button type="button" onClick={onClose} className="absolute right-3 top-4 z-10 p-1 text-paper" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {nav}
          </div>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-9 w-9 items-center justify-center border border-line bg-panel lg:hidden" aria-label="Open menu">
      <Menu className="h-4 w-4" />
    </button>
  );
}
