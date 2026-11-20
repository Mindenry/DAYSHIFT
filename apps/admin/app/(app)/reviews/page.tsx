import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { apiGet, dateTime } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { ReviewModeration } from "@/components/review-moderation";
import Link from "next/link";

interface ReviewsResponse {
  items: Array<{
    id: string; rating: number; title: string | null; body: string; status: string;
    isVerifiedPurchase: boolean; helpfulCount: number; createdAt: string;
    product: { name: string; slug: string };
    user: { firstName: string; lastName: string; email: string };
  }>;
  meta: { total: number };
}

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff();
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const cookie = await getCookieHeader();
  const reviews = await apiGet<ReviewsResponse>(`/admin/reviews${status ? `?status=${status}` : ""}`, { cookie });

  return (
    <div>
      <PageHeader eyebrow="Customers" title="Reviews" description="Moderate customer reviews. Only verified purchasers can review, and approved reviews appear on product pages." />
      <div className="panel">
        <nav className="flex gap-1 border-b border-line px-3">
          {[["", "All"], ["PENDING", "Pending"], ["APPROVED", "Approved"], ["REJECTED", "Rejected"]].map(([value, label]) => (
            <Link key={label} href={`/reviews${value ? `?status=${value}` : ""}`}
              className={`border-b-2 px-3 py-3 text-[11px] ${status === value ? "border-ink font-medium" : "border-transparent text-muted"}`}>
              {label}
            </Link>
          ))}
        </nav>
        {!reviews?.items.length ? <EmptyState title="No reviews in this filter" /> : (
          <ul className="divide-y divide-line">
            {reviews.items.map((review) => (
              <li key={review.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-accent" aria-label={`${review.rating} out of 5`}>{"★".repeat(review.rating)}<span className="text-line">{"★".repeat(5 - review.rating)}</span></span>
                      <Badge status={review.status} />
                      {review.isVerifiedPurchase && <span className="text-[9px] uppercase tracking-[0.08em] text-muted">Verified purchase</span>}
                    </div>
                    <p className="mt-1 text-xs font-medium">{review.title ?? "Untitled review"}</p>
                    <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-muted">{review.body}</p>
                    <p className="mt-2 text-[10px] text-muted">
                      {review.user.firstName} {review.user.lastName} · {review.user.email} · {review.product.name} · {dateTime(review.createdAt)} · {review.helpfulCount} helpful
                    </p>
                  </div>
                  <ReviewModeration id={review.id} status={review.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
