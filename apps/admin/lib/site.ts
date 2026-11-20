/**
 * Public storefront base URL used for "view store" links. Baked in at build
 * time so it works from any LAN device; override with NEXT_PUBLIC_SITE_URL.
 */
export const STOREFRONT_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
