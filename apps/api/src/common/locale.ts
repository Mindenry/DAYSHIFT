import { AsyncLocalStorage } from "node:async_hooks";
import type { NextFunction, Request, Response } from "express";

export type Locale = "th" | "en";

const storage = new AsyncLocalStorage<Locale>();

export function normalizeLocale(value: string | null | undefined): Locale {
  const raw = (value ?? "").trim().toLowerCase();
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("th")) return "th";
  return "th";
}

export function resolveLocale(req: Request): Locale {
  const header = req.header("x-locale");
  if (header) return normalizeLocale(header);
  const cookie = req.headers.cookie ?? "";
  const match = cookie.match(/(?:^|;\s*)ds_locale=(en|th)\b/i);
  if (match) return normalizeLocale(match[1]);
  return normalizeLocale(req.header("accept-language"));
}

/** Runs the rest of the request with a locale available to mappers and services. */
export function localeMiddleware(req: Request, _res: Response, next: NextFunction) {
  storage.run(resolveLocale(req), next);
}

export function currentLocale(): Locale {
  return storage.getStore() ?? "th";
}

/** Picks the localized value, falling back to the other language. */
export function pickText(
  th: string | null | undefined,
  en: string | null | undefined,
): string {
  const locale = currentLocale();
  const value = locale === "en" ? en ?? th : th ?? en;
  return value ?? "";
}

export function pickNullable(
  th: string | null | undefined,
  en: string | null | undefined,
): string | null {
  return pickText(th, en) || null;
}

export function pickList(th: string[] | null | undefined, en: string[] | null | undefined): string[] {
  const locale = currentLocale();
  if (locale === "en") return en?.length ? en : th ?? [];
  return th?.length ? th : en ?? [];
}
