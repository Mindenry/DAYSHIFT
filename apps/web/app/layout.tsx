import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bodoni-moda";
import "@fontsource-variable/bodoni-moda/wght-italic.css";
import "@fontsource-variable/manrope";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { apiGet } from "@/lib/api";
import { getSession } from "@/lib/session";
import { getI18n } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n-client";
import { serializeJsonLd } from "@dayshift/config";
import type { CategorySummary } from "@dayshift/types";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "DAYSHIFT — Considered clothing for everyday life",
    template: "%s — DAYSHIFT",
  },
  description:
    "Shop contemporary Thai clothing, shoes, bags and accessories for women and men. Considered pieces made in small runs, priced in THB with 7% VAT, free delivery over ฿1,500 and 30-day returns.",
  applicationName: "DAYSHIFT",
  category: "shopping",
  alternates: { types: { "text/plain": "/llms.txt" } },
  keywords: [
    "contemporary clothing",
    "women's clothing",
    "men's clothing",
    "everyday essentials",
    "shoes",
    "bags",
    "accessories",
    "small-run fashion",
  ],
  openGraph: {
    title: "DAYSHIFT — Considered clothing for everyday life",
    description:
      "Contemporary clothing and accessories for the days that make up a life. New season essentials, made in small runs.",
    type: "website",
    siteName: "DAYSHIFT",
    locale: "en_US",
    url: "/",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "DAYSHIFT autumn studio collection" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DAYSHIFT — Considered clothing for everyday life",
    description: "Contemporary clothing and accessories, made in small runs.",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#F6F2E9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categories, user, { locale, t }] = await Promise.all([
    apiGet<CategorySummary[]>("/categories", { revalidate: 120 }).catch(() => []),
    getSession().catch(() => null),
    getI18n(),
  ]);

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DAYSHIFT",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
    description:
      "Contemporary clothing, footwear, bags and accessories made in small runs for everyday wear.",
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DAYSHIFT",
    url: SITE,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-paper text-ink">
        <I18nProvider locale={locale}>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteLd) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-3 focus:text-paper"
        >
          {t("Skip to main content")}
        </a>
        <SiteHeader categories={categories ?? []} user={user} />
        <main id="main">{children}</main>
        <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
