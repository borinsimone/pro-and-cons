import type { NextConfig } from "next";

const basePath = process.env.PAGES_BASE_PATH ?? "";
const nextConfig: NextConfig = {
  output: "export",
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
