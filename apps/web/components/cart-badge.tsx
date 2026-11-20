"use client";

import { useEffect, useState } from "react";
import { clientApi } from "@/lib/api";

export function CartBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const cart = await clientApi<{ itemCount: number }>("/cart");
        if (active) setCount(cart.itemCount);
      } catch {
        /* anonymous cart may fail before hydration; leave blank */
      }
    };
    void load();
    const onUpdate = () => void load();
    window.addEventListener("cart:updated", onUpdate);
    return () => {
      active = false;
      window.removeEventListener("cart:updated", onUpdate);
    };
  }, []);

  if (!count) return null;
  return (
    <span
      key={count}
      className="animate-pop absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-medium text-paper"
    >
      {count}
    </span>
  );
}
