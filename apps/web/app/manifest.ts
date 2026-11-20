import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DAYSHIFT — Considered clothing for everyday life",
    short_name: "DAYSHIFT",
    description:
      "Contemporary clothing, shoes, bags and accessories for women and men, made in small runs.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f2e9",
    theme_color: "#f6f2e9",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
