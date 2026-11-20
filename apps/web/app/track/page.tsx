import type { Metadata } from "next";
import { TrackOrder } from "@/components/track-order";
import { getI18n } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Look up your DAYSHIFT order and follow its journey.",
  alternates: { canonical: "/track" },
};

export default async function TrackPage() {
  const { t } = await getI18n();
  return (
    <div className="wrap py-12 md:py-20">
      <div className="max-w-md">
        <p className="overline text-muted">{t("Order care")}</p>
        <h1 className="mt-2 font-display text-5xl">{t("Track your order")}</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {t("Enter your order number and the email used at checkout. Guest and account orders both work.")}
        </p>
      </div>
      <div className="mt-10">
        <TrackOrder />
      </div>
    </div>
  );
}
