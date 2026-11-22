import { ApiError } from "./api-error";
import { getLocale } from "./i18n";

const API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

export { ApiError };

interface FetchOptions {
  cookie?: string;
  revalidate?: number | false;
  tags?: string[];
}

export async function apiGet<T>(path: string, options: FetchOptions = {}): Promise<T | null> {
  const locale = await getLocale();
  const headers: Record<string, string> = { "x-locale": locale };
  if (options.cookie) headers.cookie = options.cookie;
  // Include the locale in the cache key so the Next data cache never serves
  // a Thai response to an English visitor (or the reverse).
  const url = new URL(`${API_BASE}/api/v1${path}`);
  url.searchParams.set("_locale", locale);
  const response = await fetch(url.toString(), {
    headers,
    next:
      options.revalidate === false
        ? { revalidate: 0 }
        : { revalidate: options.revalidate ?? 30, tags: options.tags },
    cache: options.revalidate === false ? "no-store" : undefined,
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(response.status, "API_ERROR", body?.message ?? "Request failed");
  }
  const body = (await response.json()) as { data: T };
  return body.data;
}

export async function apiGetOrThrow<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const data = await apiGet<T>(path, options);
  if (data === null) throw new ApiError(404, "NOT_FOUND", "Not found");
  return data;
}
