"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "@/lib/api";

interface RecentItem {
  id: string;
  slug: string;
  name: string;
  price: string;
  image: string | null;
}

const KEY = "ds-recently-viewed";

export function RecentlyViewed({ current }: { current: RecentItem }) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    let existing: RecentItem[];
    try {
      existing = JSON.parse(localStorage.getItem(KEY) ?? "[]") as RecentItem[];
    } catch {
      existing = [];
    }
    const next = [current, ...existing.filter((item) => item.id !== current.id)].slice(0, 8);
    localStorage.setItem(KEY, JSON.stringify(next));
    setItems(next.filter((item) => item.id !== current.id).slice(0, 4));
  }, [current]);

  if (items.length === 0) return null;

  return (
    <section className="border-t border-line py-14">
      <div className="wrap">
        <p className="overline text-muted">Recently viewed</p>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((item) => (
            <Link key={item.id} href={`/products/${item.slug}`} className="group flex gap-3">
              {item.image && (
                 
                <img src={item.image} alt="" className="h-24 w-20 shrink-0 object-cover" />
              )}
              <div className="pt-1">
                <p className="font-display text-base leading-snug group-hover:underline">{item.name}</p>
                <p className="mt-1 text-xs text-muted">{money(item.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
