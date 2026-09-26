import path from "node:path";
import { defineConfig } from "vitest/config";

type Alias = { find: RegExp; replacement: string };

/** Vitest setup for a phase that imports shared modules from `common/`. Local aliases are checked first. */
export function phaseVitestConfig(local: Alias[]) {
  const phaseRoot = process.cwd();
  const commonRoot = path.resolve(phaseRoot, "../common");
  return defineConfig({
    test: {
      environment: "node",
      include: ["../common/lib/**/*.test.ts", "lib/**/*.test.ts"],
      exclude: ["e2e/**", "node_modules/**", ".next/**"],
    },
    resolve: {
      alias: [...local, { find: /^@\//, replacement: `${commonRoot}/` }],
    },
  });
}

export function phaseFile(relativePath: string) {
  return path.resolve(process.cwd(), relativePath);
}
