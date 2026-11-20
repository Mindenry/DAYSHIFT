import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getI18n } from "@/lib/i18n";
import { serializeJsonLd } from "@dayshift/config";

export const metadata: Metadata = {
  title: "Customer care",
  description: "Delivery, returns, sizing and order help from the DAYSHIFT customer care team.",
  alternates: { canonical: "/support" },
  openGraph: {
    title: "Customer care",
    description: "Delivery, returns, sizing and order help from the DAYSHIFT customer care team.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "DAYSHIFT customer care" }],
  },
};

const FAQS = [
  {
    question: "How long does delivery take?",
    answer: "Standard delivery arrives in 3–5 business days and is free over $150. Express delivery is available at checkout.",
  },
  {
    question: "What is your return policy?",
    answer: "Return unworn pieces with tags attached within 30 days of delivery. Returns are free. Final sale pieces cannot be returned.",
  },
  {
    question: "How do exchanges work?",
    answer: "Start an exchange from your order in the account area. Choose the replacement size or colour, send the original back, and we ship the replacement once it is inspected.",
  },
  {
    question: "Do you offer plus and extended sizes?",
    answer: "Our clothing runs XS–XXL, with selected pieces in additional sizes. If you need measurements for a specific piece, contact us.",
  },
  {
    question: "Can I change my order after placing it?",
    answer: "Before it is packed, yes. Contact us as soon as possible with your order number. Once shipped, you can use the returns process.",
  },
];

export default async function SupportPage() {
  const session = await getSession();
  const { t } = await getI18n();
  const faqs = FAQS.map((faq) => ({ question: t(faq.question), answer: t(faq.answer) }));
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqLd) }} />
      <div className="wrap py-12 md:py-20">
        <div className="max-w-2xl">
          <p className="overline text-muted">{t("Customer care")}</p>
          <h1 className="mt-2 font-display text-5xl leading-tight md:text-7xl">{t("We are here to help.")}</h1>
          <p className="mt-5 text-sm leading-relaxed text-muted">
            {t("Questions about a piece, an order or a return? Our team is small, knowledgeable and answers within one business day.")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={session ? "/account/support" : "/login?next=/account/support"} className="btn btn-primary">
              {session ? t("Message customer care") : t("Sign in to message us")}
            </Link>
            <Link href="/track" className="btn btn-outline">{t("Track an order")}</Link>
          </div>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.3fr_0.7fr]">
          <section>
            <h2 className="border-b border-line pb-3 font-display text-3xl">{t("Common questions")}</h2>
            <div className="mt-2 divide-y divide-line">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl">
                    {faq.question}
                    <span className="text-xl text-muted transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
          <aside className="space-y-6">
            <div className="border border-line p-6">
              <p className="overline text-muted">{t("Contact")}</p>
              <p className="mt-4 text-sm">hello@dayshift.example</p>
              <p className="mt-1 text-sm text-muted">{t("Monday–Friday, 9am–6pm ICT")}</p>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                {t("Addresses and phone contacts are demonstration data. No real customer data is processed.")}
              </p>
            </div>
            <div className="border border-line p-6">
              <p className="overline text-muted">{t("Quick links")}</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/help/delivery-returns" className="link-underline">{t("Delivery & returns")}</Link></li>
                <li><Link href="/help/size-guide" className="link-underline">{t("Size guide")}</Link></li>
                <li><Link href="/help/care" className="link-underline">{t("Care guide")}</Link></li>
                <li><Link href="/track" className="link-underline">{t("Order tracking")}</Link></li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
