import Link from "next/link";
import { NewsletterForm } from "./newsletter-form";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "Women", href: "/c/women" },
      { label: "Men", href: "/c/men" },
      { label: "Unisex", href: "/c/unisex" },
      { label: "Shoes", href: "/c/shoes" },
      { label: "Bags", href: "/c/bags" },
      { label: "Accessories", href: "/c/accessories" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Delivery & returns", href: "/help/delivery-returns" },
      { label: "Size guide", href: "/help/size-guide" },
      { label: "Track your order", href: "/track" },
      { label: "Contact us", href: "/support" },
      { label: "Care guide", href: "/help/care" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our story", href: "/about" },
      { label: "Materials", href: "/about/materials" },
      { label: "Stores", href: "/about/stores" },
      { label: "Careers", href: "/about/careers" },
      { label: "Journal", href: "/journal" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-paper-deep">
      <div className="wrap py-16">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_1.8fr]">
          <div>
            <p className="font-display text-4xl tracking-[0.14em]">DAYSHIFT</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Considered clothing and accessories for the days that make up a life.
              Made in small runs, built to be worn.
            </p>
            <div className="mt-8 max-w-md">
              <p className="overline mb-3">The DAYSHIFT note</p>
              <p className="mb-4 text-sm text-muted">
                New arrivals, studio notes and early access. No noise.
              </p>
              <NewsletterForm />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="overline text-muted">{column.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="link-underline text-sm">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DAYSHIFT. All rights reserved.</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/legal/privacy" className="link-underline">Privacy</Link>
            <Link href="/legal/terms" className="link-underline">Terms</Link>
            <Link href="/legal/cookies" className="link-underline">Cookies</Link>
            <Link href="/legal/accessibility" className="link-underline">Accessibility</Link>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-[11px] leading-relaxed text-muted">
          Demonstration storefront. Product imagery is illustrative studio art generated for this
          project, not photographs of real inventory. Sandbox payments are simulated locally and no
          money is processed.
        </p>
      </div>
    </footer>
  );
}
