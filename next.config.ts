import type { NextConfig } from "next";
import path from "node:path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(import.meta.dirname),
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
