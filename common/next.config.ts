import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// The only env file is the repository root, one folder above this phase.
loadEnvConfig(path.join(__dirname, ".."));

const nextConfig: NextConfig = {
  // CLAUDE.md is maintained by hand. Next would otherwise append its own rules on every dev start.
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
