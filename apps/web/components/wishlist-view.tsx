"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ProductCardDto } from "@dayshift/types";
import { clientApi, money } from "@/lib/api";

interface WishlistItem {
  id: string;
  addedAt: string;
  product: ProductCardDto;
  selectedVariant: { id: string; size: string | null; color: string | null } | null;
}

export function WishlistView() {
  const [items, setItems] = useState<WishlistItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await clientApi<{ items: WishlistItem[] }>("/wishlist");
      setItems(data.items);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const remove = async (productId: string, name: string) => {
    setBusy(productId);
    try {
      await clientApi(`/wishlist/items/${productId}`, { method: "DELETE" });
      setItems((current) => current?.filter((item) => item.product.id !== productId) ?? null);
      toast(`${name} removed from wishlist`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove item");
    } finally {
      setBusy(null);
    }
  };

  const move = async (productId: string) => {
    setBusy(productId);
    try {
      await clientApi(`/wishlist/items/${productId}/move-to-cart`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setItems((current) => current?.filter((item) => item.product.id !== productId) ?? null);
      window.dispatchEvent(new Event("cart:updated"));
      toast("Added to your bag");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add to bag");
    } finally {
      setBusy(null);
    }
  };

  if (items === null) {
    return <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-80 animate-pulse bg-sand" />)}</div>;
  }

  if (!items.length) {
    return (
      <div className="py-20 text-center">
        <h2 className="font-display text-3xl">Nothing saved yet.</h2>
        <p className="mt-3 text-sm text-muted">Tap the heart on a piece to keep it here for later.</p>
        <Link href="/collections/new-arrivals" className="btn btn-outline mt-8">Explore new arrivals</Link>
      </div>
    );
  }

  return (
    <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-6 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id}>
          <Link href={`/products/${item.product.slug}`} className="group block">
            <div className="aspect-[3/4] overflow-hidden bg-sand">
              {item.product.primaryImage && (
                 
                <img src={item.product.primaryImage} alt={item.product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
              )}
            </div>
            <h3 className="mt-3 font-display text-lg">{item.product.name}</h3>
            <p className="mt-1 text-sm">{money(item.product.price)}</p>
            <p className={`mt-1 text-xs ${item.product.inStock ? "text-muted" : "text-sale"}`}>
              {item.product.inStock ? "In stock" : "Out of stock"}
            </p>
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => move(item.product.id)}
              disabled={busy === item.product.id || !item.product.inStock}
              className="text-[11px] uppercase tracking-[0.1em] underline disabled:opacity-40"
            >
              {busy === item.product.id ? "Adding…" : "Add to bag"}
            </button>
            <button
              type="button"
              onClick={() => remove(item.product.id, item.product.name)}
              disabled={busy === item.product.id}
              className="text-[11px] uppercase tracking-[0.1em] text-muted underline"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
