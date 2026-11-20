import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "DAYSHIFT Operations", template: "%s — DAYSHIFT Ops" },
  description: "DAYSHIFT commerce administration and retail operations.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1c1b19",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink">{children}</body>
    </html>
  );
}
