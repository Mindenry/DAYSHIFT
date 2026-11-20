import type { NextConfig } from "next";

const apiInternal = process.env.API_INTERNAL_URL ?? "http://localhost:4000";
const webInternal = process.env.WEB_INTERNAL_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  transpilePackages: ["@dayshift/config", "@dayshift/types", "@dayshift/validation"],
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiInternal}/api/:path*` },
      { source: "/images/products/:path*", destination: `${webInternal}/images/products/:path*` },
      { source: "/art/:path*", destination: `${webInternal}/art/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
