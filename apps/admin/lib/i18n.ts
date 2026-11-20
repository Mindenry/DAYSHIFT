import { cookies } from "next/headers";
import { translate, type Locale } from "./messages";

export const LOCALE_COOKIE = "ds_locale";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get(LOCALE_COOKIE)?.value === "th" ? "th" : "en";
}

export async function getI18n() {
  const locale = await getLocale();
  return {
    locale,
    t: (text: string, vars?: Record<string, string | number>) => translate(locale, text, vars),
  };
}
