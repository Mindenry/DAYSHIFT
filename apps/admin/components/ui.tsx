import Link from "next/link";

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
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div>
        {back && <Link href={back.href} className="text-[11px] text-muted hover:text-ink">← {back.label}</Link>}
        {eyebrow && <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-medium tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const TONES: Record<string, string> = {
  green: "bg-accent-soft text-accent border-accent/20",
  amber: "bg-warn-soft text-warn border-warn/20",
  red: "bg-danger-soft text-danger border-danger/20",
  blue: "bg-info-soft text-info border-info/20",
  neutral: "bg-paper text-muted border-line",
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
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] ${TONES[tone]}`}>
      {label ?? status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-medium">{title}</p>
      {body && <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted">{body}</p>}
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
  if (totalPages <= 1) return null;
  const build = (next: number) => {
    const search = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([key, value]) => value && search.set(key, value));
    search.set("page", String(next));
    return `${basePath}?${search.toString()}`;
  };
  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs">
      <p className="text-muted">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        {page > 1 && <Link href={build(page - 1)} className="a-btn a-btn-outline a-btn-sm">Previous</Link>}
        {page < totalPages && <Link href={build(page + 1)} className="a-btn a-btn-outline a-btn-sm">Next</Link>}
      </div>
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const toneClass =
    tone === "green" ? "text-accent" : tone === "amber" ? "text-warn" : tone === "red" ? "text-danger" : "text-ink";
  return (
    <div className="panel p-4">
      <p className="text-[10px] uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-medium tracking-tight ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
