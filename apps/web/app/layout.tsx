import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { apiGet } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { CategorySummary } from "@dayshift/types";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "DAYSHIFT — Everyday style. Your way.",
    template: "%s — DAYSHIFT",
  },
  description:
    "Contemporary clothing, footwear, bags and accessories for everyday wear. Considered pieces, made in small runs, built to be worn.",
  applicationName: "DAYSHIFT",
  openGraph: {
    title: "DAYSHIFT — Everyday style. Your way.",
    description:
      "Considered clothing and accessories for the days that make up a life. New season essentials, made properly.",
    type: "website",
    siteName: "DAYSHIFT",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#F6F2E9",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categories, user] = await Promise.all([
    apiGet<CategorySummary[]>("/categories", { revalidate: 120 }).catch(() => []),
    getSession().catch(() => null),
  ]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-3 focus:text-paper"
        >
          Skip to main content
        </a>
        <SiteHeader categories={categories ?? []} user={user} />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
