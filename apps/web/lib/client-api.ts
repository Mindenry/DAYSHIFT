"use client";

import { ApiError } from "./api-error";

export { ApiError };

function currentLocale() {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)ds_locale=(en|th)\b/);
  return match?.[1] ?? "en";
}

/** Browser-side call through the same-origin /api rewrite (cookies flow). */
export async function clientApi<T>(path: string, init?: RequestInit): Promise<T> {
  const locale = currentLocale();
  const url = new URL(`/api/v1${path}`, window.location.origin);
  url.searchParams.set("_locale", locale);
  const response = await fetch(`${url.pathname}${url.search}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-locale": locale,
      ...(init?.headers ?? {}),
    },
    credentials: "same-origin",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(body?.message)
      ? body.message.join(". ")
      : body?.message ?? "Something went wrong.";
    throw new ApiError(response.status, body?.code ?? "ERROR", message);
  }
  return body?.data as T;
}
