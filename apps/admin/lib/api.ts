const API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function apiGet<T>(path: string, options: { cookie?: string; revalidate?: number | false } = {}): Promise<T | null> {
  const response = await fetch(`${API_BASE}/api/v1${path}`, {
    headers: options.cookie ? { cookie: options.cookie } : undefined,
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(response.status, "API_ERROR", body?.message ?? "Request failed");
  }
  const body = (await response.json()) as { data: T };
  return body.data;
}

export async function apiGetOrThrow<T>(path: string, cookie?: string): Promise<T> {
  const data = await apiGet<T>(path, { cookie });
  if (data === null) throw new ApiError(404, "NOT_FOUND", "Not found");
  return data;
}

export async function clientApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    credentials: "same-origin",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(". ") : body?.message ?? "Something went wrong.";
    throw new ApiError(response.status, body?.code ?? "ERROR", message);
  }
  return body?.data as T;
}

export function money(value: string | number | null | undefined) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function date(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function dateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
