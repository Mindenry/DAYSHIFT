"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { clientApi, money } from "@/lib/api";
import { usePresence } from "./use-presence";
import { useI18n } from "@/lib/i18n-client";

interface Suggestion {
  products: Array<{ id: string; name: string; slug: string; price: string; image: string | null }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  collections: Array<{ id: string; name: string; slug: string }>;
  popular: string[];
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<Suggestion | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { mounted, state } = usePresence(open, 220);
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    try {
      const stored = JSON.parse(localStorage.getItem("ds-recent-searches") ?? "[]");
      setRecent(Array.isArray(stored) ? stored.slice(0, 5) : []);
    } catch {
      setRecent([]);
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 40);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setData(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const result = await clientApi<Suggestion>(
          `/search/suggestions?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        setData(result);
      } catch {
        /* aborted */
      }
    }, 280);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  if (!mounted) return null;
  const isOpen = state === "open";

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    const recent = JSON.parse(localStorage.getItem("ds-recent-searches") ?? "[]") as string[];
    localStorage.setItem(
      "ds-recent-searches",
      JSON.stringify([query.trim(), ...recent.filter((item) => item !== query.trim())].slice(0, 6)),
    );
    onClose();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-paper transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={t("Search")}
      aria-hidden={!isOpen}
    >
      <div
        className={`wrap transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "translate-y-0" : "-translate-y-3"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-line">
          <p className="overline">{t("Search DAYSHIFT")}</p>
          <button type="button" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center" aria-label={t("Close search")}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="flex items-center gap-4 border-b border-ink py-5">
          <Search className="h-6 w-6 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Search for a piece, a category or a SKU")}
            className="w-full bg-transparent font-display text-2xl outline-none placeholder:text-stone md:text-4xl"
            aria-label={t("Search products")}
          />
        </form>

        <div className="grid gap-12 py-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            {data?.products?.length ? (
              <>
                <p className="overline text-muted">{t("Products")}</p>
                <ul className="mt-4 divide-y divide-line">
                  {data.products.map((product) => (
                    <li key={product.id}>
                      <Link href={`/products/${product.slug}`} onClick={onClose} className="flex items-center gap-4 py-3">
                        {product.image && (
                           
                          <img src={product.image} alt="" className="h-16 w-14 object-cover" />
                        )}
                        <span className="flex-1 font-display text-lg">{product.name}</span>
                        <span className="text-sm text-muted">{money(product.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div>
                {recent.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="overline text-muted">{t("Recent searches")}</p>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem("ds-recent-searches");
                          setRecent([]);
                        }}
                        className="min-h-11 px-1 text-[10px] uppercase tracking-[0.12em] text-muted underline underline-offset-4"
                      >
                        {t("Clear")}
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {recent.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => setQuery(term)}
                          className="min-h-11 border border-line px-4 text-xs hover:border-ink"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <p className={`overline text-muted ${recent.length ? "mt-8" : ""}`}>{t("Popular right now")}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(data?.popular ?? ["เสื้อลินิน", "เสื้อยืดโอเวอร์ไซซ์", "กางเกงยีนส์ขาตรง", "กระเป๋าโท้ต", "ไหมพรมเมอริโน"]).map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="min-h-11 border border-line px-4 text-xs uppercase tracking-[0.14em] hover:border-ink"
                    >
                      {term}
                    </button>
                  ))}
                </div>
                <p className="mt-10 max-w-md text-sm leading-relaxed text-muted">
                  {t("Search by product name, category or SKU. Try “DS-TEE-001” to find a specific style.")}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-8">
            {!!data?.categories?.length && (
              <div>
                <p className="overline text-muted">{t("Categories")}</p>
                <ul className="mt-3 space-y-2">
                  {data.categories.map((category) => (
                    <li key={category.id}>
                      <Link href={`/c/${category.slug}`} onClick={onClose} className="link-underline font-display text-xl">
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!!data?.collections?.length && (
              <div>
                <p className="overline text-muted">{t("Collections")}</p>
                <ul className="mt-3 space-y-2">
                  {data.collections.map((collection) => (
                    <li key={collection.id}>
                      <Link href={`/collections/${collection.slug}`} onClick={onClose} className="link-underline font-display text-xl">
                        {collection.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
