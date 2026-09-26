import { phaseFile, phaseVitestConfig } from "../common/vitest-phase";

export default phaseVitestConfig([
  { find: /^@\/components\/workspace\/workspace-shell$/, replacement: phaseFile("components/workspace/workspace-shell.tsx") },
  { find: /^@\/lib\/ai\/draft$/, replacement: phaseFile("lib/ai/draft.ts") },
  { find: /^@\/lib\/records$/, replacement: phaseFile("lib/records.ts") },
  { find: /^@\/lib\/types$/, replacement: phaseFile("lib/types.ts") },
  { find: /^@\/stores\/runtime$/, replacement: phaseFile("stores/runtime.ts") },
  { find: /^@\/lib\/demo\//, replacement: `${phaseFile("lib/demo")}/` },
]);
