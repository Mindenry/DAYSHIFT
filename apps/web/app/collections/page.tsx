export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { apiGet } from "@/lib/api";

export const metadata: Metadata = {
  title: "Collections",
  description: "Curated edits from the DAYSHIFT studio: new arrivals, best sellers, essentials and limited drops.",
  alternates: { canonical: "/collections" },
  openGraph: {
    title: "Collections",
    description: "Curated edits from the DAYSHIFT studio: new arrivals, best sellers, essentials and limited drops.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "DAYSHIFT collections" }],
  },
};

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  type: string;
}

export default async function CollectionsPage() {
  const collections = (await apiGet<Collection[]>("/collections", { revalidate: 120 })) ?? [];
  return (
    <div className="wrap py-12 md:py-20">
      <p className="overline text-muted">The edits</p>
      <h1 className="mt-2 font-display text-5xl md:text-7xl">Collections</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        Smaller, considered edits rather than endless choice. Each collection is assembled by our
        studio team and changes with the season.
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <Link key={collection.id} href={`/collections/${collection.slug}`} className="group block">
            <div className="aspect-[4/3] overflow-hidden bg-sand">
              {collection.imageUrl && (
                 
                <img src={collection.imageUrl} alt={collection.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
              )}
            </div>
            <div className="mt-4">
              <h2 className="font-display text-2xl">{collection.name}</h2>
              {collection.description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{collection.description}</p>}
              <span className="mt-3 inline-block text-[11px] uppercase tracking-[0.12em] underline">Shop the edit</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
