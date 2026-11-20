"use client";

import { createContext, useContext, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, translate, type Locale } from "./messages";

interface I18nValue {
  locale: Locale;
  t: (text: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue>({
  locale: "en",
  t: (text, vars) => translate("en", text, vars),
});

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo<I18nValue>(
    () => ({ locale, t: (text, vars) => translate(locale, text, vars) }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useI18n();
  const [active, setActive] = useState<Locale>(locale);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const choose = (next: Locale) => {
    if (next === active) return;
    setActive(next);
    document.cookie = `ds_locale=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border border-line bg-surface p-0.5 ${pending ? "opacity-70" : ""}`}
      role="group"
      aria-label={t("Language")}
    >
      {LOCALES.map((item) => {
        const selected = active === item.code;
        return (
          <button
            key={item.code}
            type="button"
            onClick={() => choose(item.code)}
            aria-pressed={selected}
            title={item.label}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              selected ? "bg-ink text-paper" : "text-muted hover:text-ink"
            } ${compact ? "" : "min-w-11"}`}
          >
            {item.short}
          </button>
        );
      })}
    </div>
  );
}
