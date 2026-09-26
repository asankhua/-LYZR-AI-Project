import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// The only env file is the repository root, one folder above this phase.
loadEnvConfig(path.join(__dirname, ".."));

const nextConfig: NextConfig = {
  // CLAUDE.md is maintained by hand. Next would otherwise append its own rules on every dev start.
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1"],
  // Hugging Face builds a standalone server. The lockfile lives in the repo root, one folder up.
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, ".."),
  async headers() {
    return [
      {
        source: "/p/:path*",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
