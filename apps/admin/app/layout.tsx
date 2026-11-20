import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/noto-sans-thai";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { getLocale } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n-client";

export const metadata: Metadata = {
  title: { default: "DAYSHIFT Operations", template: "%s — DAYSHIFT Ops" },
  description: "DAYSHIFT commerce administration and retail operations.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#16201b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className="min-h-screen bg-canvas text-ink">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
