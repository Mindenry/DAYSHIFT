import type { Metadata } from "next";
import Link from "next/link";
import { apiGet, money } from "@/lib/api";
import { getCookieHeader } from "@/lib/session";
import { getI18n } from "@/lib/i18n";

export const metadata: Metadata = { title: "Returns & exchanges", robots: { index: false } };

interface ReturnSummary {
  id: string;
  returnNumber: string;
  orderNumber: string;
  status: string;
  resolution: string;
  reason: string;
  refundAmount: string | null;
  itemCount: number;
  requestedAt: string;
  customerNote: string | null;
}

const humanize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ").toLowerCase();

export default async function ReturnsPage() {
  const cookie = await getCookieHeader();
  const { t, locale } = await getI18n();
  const returns = await apiGet<ReturnSummary[]>("/returns", { cookie, revalidate: 0 });

  return (
    <div>
      <div className="border-b border-line pb-6">
        <p className="overline text-muted">{t("Account")}</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">{t("Returns & exchanges")}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          {t("Track return requests and exchanges. Refunds are issued to the original payment method after items are received and inspected.")}
        </p>
      </div>

      {!returns || returns.length === 0 ? (
        <div className="py-20 text-center">
          <h2 className="font-display text-3xl">{t("No returns in progress.")}</h2>
          <p className="mt-3 text-sm text-muted">{t("Start a return from an eligible order.")}</p>
          <Link href="/account/orders" className="btn btn-outline mt-8">{t("View orders")}</Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {returns.map((request) => (
            <li key={request.id}>
              <Link href={`/account/returns/${request.id}`} className="flex flex-wrap items-center justify-between gap-4 py-5 hover:bg-sand/25">
                <div>
                  <p className="font-display text-xl">{request.returnNumber}</p>
                  <p className="mt-1 text-xs text-muted">
                    {t("Order")} {request.orderNumber} · {request.itemCount} {request.itemCount === 1 ? t("piece") : t("pieces")} ·{" "}
                    {new Date(request.requestedAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="mt-2 inline-flex border border-line px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-muted">
                    {t(humanize(request.status))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{t(humanize(request.resolution))}</p>
                  {request.refundAmount && <p className="mt-1 text-xs text-muted">{money(request.refundAmount)}</p>}
                  <span className="mt-2 inline-block text-[11px] uppercase tracking-[0.1em] underline">{t("View details")}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
