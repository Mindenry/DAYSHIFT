import type { Locale } from "@/lib/messages";

/** Picks the Thai or English value, falling back to whichever exists. */
export function localized(locale: Locale, th: string | null | undefined, en: string | null | undefined) {
  const value = locale === "en" ? en ?? th : th ?? en;
  return value ?? "";
}
