"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  type LucideIcon,
  Package,
  ReceiptText,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-client";
import { enumLabel } from "@/lib/messages";

const STAT_ICONS = {
  wallet: Wallet,
  trending: TrendingUp,
  receipt: ReceiptText,
  package: Package,
  alert: AlertTriangle,
  boxes: Boxes,
  returns: RotateCcw,
  orders: ShoppingCart,
  customers: BadgeDollarSign,
} satisfies Record<string, LucideIcon>;

export type StatIcon = keyof typeof STAT_ICONS;

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  const { t } = useI18n();
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-ink">
            <ArrowLeft className="h-3 w-3" /> {t(back.label)}
          </Link>
        )}
        {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">{t(eyebrow)}</p>}
        <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-[-0.035em] text-ink md:text-[30px]">{t(title)}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-[12.5px] leading-relaxed text-muted">{t(description)}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const TONES: Record<string, string> = {
  green: "bg-accent-soft text-accent border-accent/15",
  amber: "bg-warn-soft text-warn border-warn/15",
  red: "bg-danger-soft text-danger border-danger/15",
  blue: "bg-info-soft text-info border-info/15",
  neutral: "bg-surface-2 text-muted border-line",
};

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  ACTIVE: "green", PAID: "green", DELIVERED: "green", COMPLETED: "green", APPROVED: "green", SENT: "green", RECEIVED: "green", PROCESSING: "blue",
  PENDING: "amber", PENDING_PAYMENT: "amber", ON_HOLD: "amber", PACKED: "blue", PICKING: "blue", SHIPPED: "blue", OUT_FOR_DELIVERY: "blue",
  REQUESTED: "amber", UNDER_REVIEW: "amber", RETURN_SHIPPED: "blue", INSPECTED: "blue", REFUND_PENDING: "amber", REFUNDED: "green",
  CANCELLED: "red", PAYMENT_FAILED: "red", REJECTED: "red", FAILED: "red", SUSPENDED: "red", ARCHIVED: "red", DRAFT: "neutral", CLOSED: "neutral",
  OPEN: "amber", IN_PROGRESS: "blue", WAITING_FOR_CUSTOMER: "amber", WAITING_FOR_INTERNAL_TEAM: "amber", RESOLVED: "green",
  LOW: "neutral", NORMAL: "blue", HIGH: "amber", URGENT: "red",
  READY_TO_SHIP: "amber", IN_TRANSIT: "blue", RETURN_TO_SENDER: "red", FAILED_DELIVERY: "red",
};

export function Badge({ status, label }: { status: string; label?: string }) {
  const { t, locale } = useI18n();
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] ${TONES[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone === "green" ? "bg-accent" : tone === "amber" ? "bg-warn" : tone === "red" ? "bg-danger" : tone === "blue" ? "bg-info" : "bg-muted"}`} />
      {label ? t(label) : enumLabel(locale, status)}
    </span>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-muted">
        <span className="text-lg">·</span>
      </div>
      <p className="text-sm font-semibold">{t(title)}</p>
      {body && <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted">{t(body)}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  basePath,
  params,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  const { t } = useI18n();
  if (totalPages <= 1) return null;
  const build = (next: number) => {
    const search = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([key, value]) => value && search.set(key, value));
    search.set("page", String(next));
    return `${basePath}?${search.toString()}`;
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs">
      <p className="text-muted">
        {t("Page")} {page} {t("of")} {totalPages}
      </p>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={build(page - 1)} className="a-btn a-btn-outline a-btn-sm">
            <ArrowLeft className="h-3 w-3" /> {t("Previous")}
          </Link>
        )}
        {page < totalPages && (
          <Link href={build(page + 1)} className="a-btn a-btn-outline a-btn-sm">
            {t("Next")} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "green" | "amber" | "red";
  icon?: StatIcon;
}) {
  const { t } = useI18n();
  const Icon = icon ? STAT_ICONS[icon] : null;
  const toneClass = tone === "green" ? "text-accent" : tone === "amber" ? "text-warn" : tone === "red" ? "text-danger" : "text-ink";
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">{t(label)}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-muted">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className={`mt-2.5 text-[26px] font-semibold tracking-[-0.04em] ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
