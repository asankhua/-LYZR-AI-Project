import { readFileSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// The only env file is the repository root, one folder above this phase.
// Existing process env wins, so CI and the Space can override the file.
const envFile = path.join(__dirname, "..", ".env");
try {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
} catch {
  // A missing .env is fine when the host injects variables.
}

const nextConfig: NextConfig = {
  // CLAUDE.md is maintained by hand. Next would otherwise append its own rules on every dev start.
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1"],
  // Hugging Face and Render build a standalone server. The lockfile lives in the repo root, one folder up.
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
