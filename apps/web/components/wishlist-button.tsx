"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi, ApiError } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n-client";

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
  const { t } = useI18n();
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
        toast(t("{name} removed from your wishlist", { name: productName }));
      } else {
        await clientApi("/wishlist/items", {
          method: "POST",
          body: JSON.stringify({ productId, variantId }),
        });
        setSaved(true);
        toast(t("Saved {name}", { name: productName }));
      }
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        toast(t("Sign in to save pieces to your wishlist"));
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      } else {
        toast.error(error instanceof Error ? error.message : t("Could not update wishlist"));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? t("Remove {name} from wishlist", { name: productName }) : t("Save {name} to wishlist", { name: productName })}
      aria-pressed={saved}
      className={`flex items-center justify-center border border-line bg-paper/85 backdrop-blur transition duration-150 hover:bg-paper active:scale-90 ${
        large ? "h-12 w-12" : "h-10 w-10 sm:h-9 sm:w-9"
      }`}
    >
      <Heart className={`${large ? "h-5 w-5" : "h-4 w-4"} ${saved ? "fill-ink" : ""}`} />
    </button>
  );
}
