import { MAX_IMPORT_FILE_BYTES, safeRelativePath, selectImportFiles } from "@/lib/github/filter";
import { listRemoteFiles, type GitHubApi, type TreeItem } from "@/lib/github/sync";

type BlobRef = { path: string; bytes: number; binary: boolean; sha: string };

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

export async function filesFromRepo(api: GitHubApi, repo: string, branch: string, root?: string) {
  const tree = await listRemoteFiles(api, repo, branch);
  if (!tree.ok) return tree;
  const candidates = tree.items.flatMap((item) => candidate(item));
  const selected = selectImportFiles(candidates, root);
  if (!selected.ok) return { ok: false as const, status: 413, message: selected.error };
  const prefix = root?.trim() ? `${root.trim().replace(/\/$/, "")}/` : "";
  const byPath = new Map(candidates.map((item) => [item.path, item.sha]));
  const files = await mapPool(selected.files, 8, async (file) => {
    const sha = byPath.get(`${prefix}${file.path}`);
    if (!sha) return null;
    const response = await api.request<{ content?: string }>("GET", `/repos/${repo}/git/blobs/${sha}`);
    if (response.status === 401) throw new Error("Reconnect GitHub.");
    if (response.status >= 300 || !response.data.content) return null;
    const bytes = Buffer.from(response.data.content, "base64");
    if (bytes.includes(0)) return null;
    const path = safeRelativePath(file.path);
    if (!path) return null;
    return { path, content: bytes.toString("utf8") };
  });
  return { ok: true as const, files: files.filter((file): file is { path: string; content: string } => Boolean(file)) };
}

function candidate(item: TreeItem): BlobRef[] {
  const path = item.path ? safeRelativePath(item.path) : null;
  if (!path || item.type !== "blob" || !item.sha) return [];
  return [{ path, bytes: item.size ?? 0, binary: (item.size ?? 0) > MAX_IMPORT_FILE_BYTES, sha: item.sha }];
}
