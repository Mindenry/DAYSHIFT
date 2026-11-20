"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi, ApiError } from "@/lib/api";

export function WishlistButton({
  productId,
  productName,
  variantId,
  large = false,
}: {
  productId: string;
  productName: string;
  variantId?: string;
  large?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const toggle = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      if (saved) {
        await clientApi(`/wishlist/items/${productId}`, { method: "DELETE" });
        setSaved(false);
        toast(`Removed ${productName} from your wishlist`);
      } else {
        await clientApi("/wishlist/items", {
          method: "POST",
          body: JSON.stringify({ productId, variantId }),
        });
        setSaved(true);
        toast(`Saved ${productName}`);
      }
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        toast("Sign in to save pieces to your wishlist");
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      } else {
        toast.error(error instanceof Error ? error.message : "Could not update wishlist");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      aria-pressed={saved}
      className={`flex items-center justify-center border border-line bg-paper/85 backdrop-blur transition-colors hover:bg-paper ${
        large ? "h-12 w-12" : "h-9 w-9"
      }`}
    >
      <Heart className={`${large ? "h-5 w-5" : "h-4 w-4"} ${saved ? "fill-ink" : ""}`} />
    </button>
  );
}
