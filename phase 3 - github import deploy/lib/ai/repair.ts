import type { PreviewError, ProjectFile } from "@/lib/types";

export function repairFiles(files: ProjectFile[], errors: PreviewError[]): { path: string; content: string }[] | null {
  const error = errors[0];
  if (!error || error.message.includes("forced-unfixable")) return null;
  const match = error.message.match(/Failed to resolve import ["']([^"']+)["']/);
  if (!match) return null;
  const file = files.find((item) => item.path === (error.file ?? "src/App.tsx"));
  if (!file) return null;
  const spec = match[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const next = file.content.replace(new RegExp(`import[^;\\n]*["']${spec}["'];?\\n?`), "");
  if (next === file.content) return null;
  return [{ path: file.path, content: next }];
}

export function applyChange(files: ProjectFile[], message: string): { path: string; content: string }[] {
  const targeted = message.match(/In `([^`]+)`/);
  const wanted = targeted?.[1] ?? "src/App.tsx";
  const file = files.find((item) => item.path === wanted) ?? files.find((item) => item.path === "src/App.tsx");
  if (!file) return [];
  const note = JSON.stringify(message.replace(/`/g, "'"));
  if (file.content.includes('data-arch-note="summary"')) {
    const content = file.content.replace(/(<p data-arch-note="summary"[^>]*>\{)[\s\S]*?(\}<\/p>)/, `$1${note}$2`);
    return [{ path: file.path, content }];
  }
  const content = file.content.includes("</h1>")
    ? file.content.replace("</h1>", `</h1>\n      <p>${message.replace(/[<>]/g, "")}</p>`)
    : `${file.content}\n/* ${message.replace(/\*\//g, "")} */\n`;
  return [{ path: file.path, content }];
}
