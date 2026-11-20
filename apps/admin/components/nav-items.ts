import {
  Activity,
  Boxes,
  ClipboardList,
  FileText,
  FolderTree,
  Gift,
  LayoutDashboard,
  Layers,
  Megaphone,
  Package,
  RotateCcw,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Ticket,
  TicketPercent,
  Truck,
  UserCog,
  Users,
  Warehouse,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
}

export const NAV_GROUPS: Array<{ title: string; links: NavLink[] }> = [
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

export const QUICK_LINKS: NavLink[] = [
  { href: "/products/new", label: "New product", icon: Package, permission: "products.create" },
  { href: "/orders?status=PAID", label: "Paid orders", icon: ShoppingCart, permission: "orders.read" },
  { href: "/inventory?lowStock=true", label: "Low stock", icon: Truck, permission: "inventory.read" },
  { href: "/returns?status=REQUESTED", label: "Returns to review", icon: RotateCcw, permission: "returns.read" },
];
