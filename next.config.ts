import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The classic (non Cache Components) rendering model is used so that
  // per-request auth (`cookies()`) in layouts/pages works without extra
  // Suspense scaffolding — appropriate for a dynamic, authenticated marketplace.
  serverExternalPackages: ["mongoose"],
  experimental: {
    // Admin listing import accepts up to 500 listings (~2 MB) per action.
    serverActions: { bodySizeLimit: "3mb" },
  },
  images: {
    // Local SVG artwork (generated demo property imagery) is served through
    // the image optimizer.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox; style-src 'unsafe-inline';",
    // Remote media hosts (optional Cloudinary media storage).
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
