import Link from "next/link";
import type { CategorySummary } from "@dayshift/types";
import { SiteHeaderClient } from "./site-header-client";

interface Props {
  categories: CategorySummary[];
  user: { firstName: string } | null;
}

const FALLBACK_NAV = [
  { name: "Women", slug: "women" },
  { name: "Men", slug: "men" },
  { name: "Unisex", slug: "unisex" },
  { name: "Shoes", slug: "shoes" },
  { name: "Bags", slug: "bags" },
  { name: "Accessories", slug: "accessories" },
];

export function SiteHeader({ categories, user }: Props) {
  const roots = categories.length ? categories : FALLBACK_NAV.map((c) => ({
    id: c.slug,
    name: c.name,
    slug: c.slug,
    children: [],
  }));

  return (
    <>
      <div className="bg-ink text-paper">
        <div className="wrap flex min-h-9 items-center justify-center gap-4 py-2 text-center">
          <p className="overline !text-[10px] !tracking-[0.18em] text-paper/90">
            Complimentary delivery over $150
            <span className="mx-3 hidden text-paper/40 sm:inline">/</span>
            <span className="hidden sm:inline">Free returns within 30 days</span>
          </p>
        </div>
      </div>
      <SiteHeaderClient roots={roots} user={user} />
    </>
  );
}

export function AnnouncementSpacer() {
  return <div className="h-9 bg-ink" aria-hidden />;
}
