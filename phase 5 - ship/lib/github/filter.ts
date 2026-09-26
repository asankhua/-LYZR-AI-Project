export const MAX_IMPORT_FILES = 500;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_FILE_BYTES = 1024 * 1024;

const SKIP_PATH = /(?:^|\/)(?:node_modules|\.git|dist|build|\.next)(?:\/|$)/;
const SKIP_FILE = /(?:^|\/)(?:package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb)$/;

export function parseGithubRepo(value: string): string | null {
  const trimmed = value.trim().replace(/\.git$/i, "").replace(/\/+$/, "");
  const fromUrl = trimmed.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/i);
  if (fromUrl) return `${fromUrl[1]}/${fromUrl[2]}`;
  if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(trimmed)) return trimmed;
  return null;
}

export function safeRelativePath(input: string): string | null {
  const path = input.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!path || path.endsWith("/") || path.includes("\0")) return null;
  if (path.split("/").some((part) => part === "" || part === "." || part === "..")) return null;
  return path;
}

export function shouldSkipImportPath(path: string): boolean {
  return SKIP_PATH.test(path) || SKIP_FILE.test(path);
}

export type ImportCandidate = { path: string; bytes: number; binary?: boolean };

export function selectImportFiles(files: ImportCandidate[], root?: string): { ok: true; files: ImportCandidate[] } | { ok: false; error: string } {
  let selected = files.filter((file) => file.path && !file.binary && !shouldSkipImportPath(file.path) && file.bytes <= MAX_IMPORT_FILE_BYTES);
  if (root?.trim()) {
    const prefix = `${root.trim().replace(/\/$/, "")}/`;
    selected = selected
      .filter((file) => file.path.startsWith(prefix))
      .map((file) => ({ ...file, path: file.path.slice(prefix.length) }))
      .filter((file) => safeRelativePath(file.path));
  }
  const total = selected.reduce((sum, file) => sum + file.bytes, 0);
  if (selected.length > MAX_IMPORT_FILES || total > MAX_IMPORT_BYTES) {
    return { ok: false, error: "This import is over the limit of 500 files and 5 MB. Choose a smaller folder." };
  }
  return { ok: true, files: selected };
}

export function detectFramework(files: { path: string; content: string }[]): "vite" | "other" {
  const root = files.find((file) => file.path === "package.json");
  if (!root) return "other";
  try {
    const json = JSON.parse(root.content) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const deps = { ...json.dependencies, ...json.devDependencies };
    if (deps.vite && (deps.react || deps["react-dom"])) return "vite";
  } catch {
    return "other";
  }
  return "other";
}

export function repoNameFromProject(name: string, id: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || `architect-${id.slice(0, 8)}`;
}

export function subdomainFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return slug.length >= 3 ? slug : "app";
}

export function isSubdomain(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/.test(value);
}
