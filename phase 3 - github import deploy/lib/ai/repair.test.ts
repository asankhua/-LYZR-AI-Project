import { describe, expect, it } from "vitest";
import { applyChange, repairFiles } from "@/lib/ai/repair";
import { themePresets } from "@/lib/templates/themes";
import { toFileTree } from "@/lib/runtime/file-tree";
import type { PreviewError, ProjectFile } from "@/lib/types";

const file = (path: string, content: string): ProjectFile => ({ projectId: "p", path, content, sha: "x" });

describe("preview repairs", () => {
  it("removes one broken import", () => {
    const broken = file("src/App.tsx", 'import { Missing } from "./missing";\nexport function App() { return null; }\n');
    const error: PreviewError = { kind: "build", message: 'Failed to resolve import "./missing" from src/App.tsx', file: "src/App.tsx", at: 1 };
    const fixed = repairFiles([broken], [error]);
    expect(fixed?.[0].content).not.toContain("./missing");
  });

  it("stops on an error it cannot repair", () => {
    const error: PreviewError = { kind: "build", message: "forced-unfixable", at: 1 };
    expect(repairFiles([file("src/App.tsx", "export {};")], [error])).toBeNull();
  });

  it("edits only the component the picker named", () => {
    const files = [file("src/App.tsx", "<p data-arch-note=\"summary\">{`keep`}</p>"), file("src/components/Header.tsx", "<h1>Title</h1>")];
    const changed = applyChange(files, "In `src/components/Header.tsx`: larger title");
    expect(changed).toHaveLength(1);
    expect(changed[0].path).toBe("src/components/Header.tsx");
    expect(changed[0].content).toContain("larger title");
  });

  it("ships eight theme presets and a nested file tree", () => {
    expect(Object.keys(themePresets)).toHaveLength(8);
    const tree = toFileTree([file("src/components/Header.tsx", "export {};")]);
    expect(tree.src && "directory" in tree.src).toBe(true);
  });
});
