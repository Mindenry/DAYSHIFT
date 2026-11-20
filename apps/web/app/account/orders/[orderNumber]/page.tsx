import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { getCookieHeader } from "@/lib/session";
import { getI18n } from "@/lib/i18n";
import { OrderDetailView, type OrderView } from "@/components/order-detail-view";
import { OrderActions } from "@/components/order-actions";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default async function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const { t, locale } = await getI18n();
  const cookie = await getCookieHeader();
  const order = await apiGet<OrderView>(`/orders/${orderNumber}`, { cookie, revalidate: 0 });
  if (!order) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <Link href="/account/orders" className="overline link-underline text-muted">{t("Back to orders")}</Link>
          <h1 className="mt-2 font-display text-4xl">{t("Order {order}", { order: order.orderNumber })}</h1>
          <p className="mt-1 text-xs text-muted">
            {t("Placed")} {new Date(order.createdAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <OrderActions
          orderNumber={order.orderNumber}
          status={order.status}
          canReturn={!!order.canReturn}
        />
      </div>
      <div className="mt-8">
        <OrderDetailView order={order} />
      </div>
    </div>
  );
}
