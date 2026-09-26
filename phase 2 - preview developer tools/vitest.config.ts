import { phaseFile, phaseVitestConfig } from "../common/vitest-phase";

export default phaseVitestConfig([
  { find: /^@\/components\/workspace\/code-pane$/, replacement: phaseFile("components/workspace/code-pane.tsx") },
  { find: /^@\/components\/workspace\/history-view$/, replacement: phaseFile("components/workspace/history-view.tsx") },
  { find: /^@\/components\/workspace\/preview-pane$/, replacement: phaseFile("components/workspace/preview-pane.tsx") },
  { find: /^@\/components\/workspace\/terminal-pane$/, replacement: phaseFile("components/workspace/terminal-pane.tsx") },
  { find: /^@\/components\/workspace\/workspace-shell$/, replacement: phaseFile("components/workspace/workspace-shell.tsx") },
  { find: /^@\/lib\/ai\/draft$/, replacement: phaseFile("lib/ai/draft.ts") },
  { find: /^@\/lib\/ai\/repair$/, replacement: phaseFile("lib/ai/repair.ts") },
  { find: /^@\/lib\/records$/, replacement: phaseFile("lib/records.ts") },
  { find: /^@\/lib\/types$/, replacement: phaseFile("lib/types.ts") },
  { find: /^@\/stores\/runtime$/, replacement: phaseFile("stores/runtime.ts") },
  { find: /^@\/lib\/demo\//, replacement: `${phaseFile("lib/demo")}/` },
  { find: /^@\/lib\/runtime\//, replacement: `${phaseFile("lib/runtime")}/` },
  { find: /^@\/lib\/templates\//, replacement: `${phaseFile("lib/templates")}/` },
]);
