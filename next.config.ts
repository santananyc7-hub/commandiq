import type { NextConfig } from "next";

/**
 * Static-export config for GitHub Pages.
 * The app deploys to a PROJECT page at https://<user>.github.io/<repo>/, so in
 * production every asset/route is prefixed with `/<repo>`. Locally (dev +
 * `next start`) basePath is empty so day-to-day work is unchanged.
 */
const repo = "commandiq";
const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? `/${repo}` : "";

const nextConfig: NextConfig = {
  output: "export", // emit a static `out/` folder
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true }, // no server = no on-demand image optimization
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true, // /cash -> /cash/index.html (Pages-friendly)
  // Exposed to the client so plain asset URLs can prefix the basePath too.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
