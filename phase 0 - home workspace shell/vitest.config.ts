import path from "node:path";
import { defineConfig } from "vitest/config";

const phaseRoot = process.cwd();

export default defineConfig({
  test: {
    environment: "node",
    include: ["../common/lib/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(phaseRoot, "../common"),
    },
  },
});
