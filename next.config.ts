import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import path from "node:path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(import.meta.dirname),
  outputFileTracingExcludes: {
    "*": [
      "./node_modules/.pnpm/sharp@*/node_modules/@img/sharp-*",
      "./node_modules/.pnpm/sharp@*/node_modules/@img/sharp-libvips-*",
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default function config(phase: string) {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    initOpenNextCloudflareForDev();
  }

  return nextConfig;
}
