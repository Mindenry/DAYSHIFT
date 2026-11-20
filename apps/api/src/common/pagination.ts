export interface PageQuery {
  page?: number | string;
  pageSize?: number | string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

export interface Paged<T> {
  items: T[];
  meta: PageMeta;
}

export function getPaging(query: PageQuery, defaultSize = 20, maxSize = 100) {
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const pageSize = Math.min(maxSize, Math.max(1, Number(query.pageSize ?? defaultSize) || defaultSize));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paged<T>(items: T[], total: number, page: number, pageSize: number): Paged<T> {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    items,
    meta: { page, pageSize, total, totalPages, hasNext: page < totalPages },
  };
}

export function parseDateRange(from?: string, to?: string) {
  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getTime() - 30 * 86_400_000);
  const end = to ? new Date(to) : now;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (start > end) return null;
  return { start, end };
}
