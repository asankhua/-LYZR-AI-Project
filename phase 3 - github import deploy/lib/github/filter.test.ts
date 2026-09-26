import { describe, expect, it } from "vitest";
import { detectFramework, isSubdomain, selectImportFiles, shouldSkipImportPath } from "@/lib/github/filter";

describe("import filter", () => {
  it("skips dependencies, build output, and lockfiles", () => {
    expect(shouldSkipImportPath("node_modules/react/index.js")).toBe(true);
    expect(shouldSkipImportPath("src/App.tsx")).toBe(false);
    expect(shouldSkipImportPath("pnpm-lock.yaml")).toBe(true);
  });

  it("rejects an import over 500 files", () => {
    const files = Array.from({ length: 501 }, (_, index) => ({ path: `src/file-${index}.ts`, bytes: 10 }));
    const result = selectImportFiles(files);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/500 files and 5 MB/);
  });

  it("rejects more than 5 MB of text", () => {
    const files = Array.from({ length: 6 }, (_, index) => ({ path: `src/file-${index}.ts`, bytes: 1024 * 1024 }));
    const result = selectImportFiles(files);
    expect(result.ok).toBe(false);
  });

  it("keeps a subfolder and detects Vite plus React", () => {
    const selected = selectImportFiles(
      [
        { path: "apps/web/package.json", bytes: 20 },
        { path: "apps/web/src/App.tsx", bytes: 20 },
        { path: "other/file.ts", bytes: 10 },
      ],
      "apps/web",
    );
    expect(selected.ok).toBe(true);
    if (!selected.ok) return;
    expect(selected.files.map((file) => file.path)).toEqual(["package.json", "src/App.tsx"]);
    expect(
      detectFramework([
        { path: "package.json", content: JSON.stringify({ dependencies: { react: "19.0.0" }, devDependencies: { vite: "6.0.0" } }) },
      ]),
    ).toBe("vite");
    expect(detectFramework([{ path: "package.json", content: JSON.stringify({ dependencies: { next: "15.0.0" } }) }])).toBe("other");
  });

  it("checks subdomain shape", () => {
    expect(isSubdomain("travel-planner")).toBe(true);
    expect(isSubdomain("-nope")).toBe(false);
    expect(isSubdomain("ab")).toBe(false);
  });
});
