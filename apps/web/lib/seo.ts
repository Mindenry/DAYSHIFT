/**
 * The layout applies the "— DAYSHIFT" title template. Seeded SEO titles often
 * already end with a brand suffix, so normalise before handing them to Next to
 * avoid "Product — DAYSHIFT — DAYSHIFT".
 */
export function stripBrandSuffix(title: string | null | undefined, fallback: string): string {
  const value = (title ?? fallback).trim();
  return value.replace(/\s*[-–—|]\s*DAYSHIFT\s*$/i, "").trim() || fallback;
}
