export type GitHubApi = {
  request<T = Record<string, unknown>>(method: string, path: string, body?: unknown): Promise<{ status: number; data: T }>;
};

export type SyncFile = { path: string; content: string; sha: string };

export type SyncInput = {
  api: GitHubApi;
  repo: string | null;
  repoName: string;
  isPrivate: boolean;
  branch: string;
  message: string;
  files: SyncFile[];
  lastManifest: Record<string, string> | null;
  lastCommitSha: string | null;
  forceBranch?: string;
  wait?: (ms: number) => Promise<void>;
};

export type SyncResult =
  | { ok: true; repo: string; commitSha: string; url: string; branch: string }
  | { ok: false; reason: "unauthorized" | "conflict" | "empty" | "error"; message: string };

type RefBody = { object?: { sha?: string }; message?: string };
type CommitBody = { sha?: string; tree?: { sha?: string }; message?: string };
type TreeBody = { sha?: string; message?: string };
type RepoBody = { full_name?: string; message?: string };

const INLINE_LIMIT = 100_000;

function unauthorized(): SyncResult {
  return { ok: false, reason: "unauthorized", message: "Reconnect GitHub." };
}

function entries(files: SyncFile[], lastManifest: Record<string, string> | null) {
  const current = new Map(files.map((file) => [file.path, file]));
  const changed: SyncFile[] = [];
  const deleted: string[] = [];
  if (!lastManifest) {
    changed.push(...files);
  } else {
    for (const file of files) {
      if (lastManifest[file.path] !== file.sha) changed.push(file);
    }
    for (const path of Object.keys(lastManifest)) {
      if (!current.has(path)) deleted.push(path);
    }
  }
  return { changed, deleted };
}

async function readRef(api: GitHubApi, repo: string, branch: string) {
  const response = await api.request<RefBody>("GET", `/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
  return { status: response.status, sha: response.data.object?.sha ?? null, message: response.data.message };
}

export async function syncRepository(input: SyncInput): Promise<SyncResult> {
  if (input.files.length === 0) return { ok: false, reason: "empty", message: "There are no files to push." };
  const wait = input.wait ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  let repo = input.repo;
  if (!repo) {
    const created = await input.api.request<RepoBody>("POST", "/user/repos", {
      name: input.repoName,
      private: input.isPrivate,
      auto_init: true,
    });
    if (created.status === 401) return unauthorized();
    if (!created.data.full_name) return { ok: false, reason: "error", message: created.data.message ?? "GitHub could not create the repository." };
    repo = created.data.full_name;
  }

  const target = input.forceBranch ?? input.branch;
  let source = await readRef(input.api, repo, input.branch);
  for (let attempt = 0; source.status === 404 && !input.repo && attempt < 4; attempt += 1) {
    await wait(50);
    source = await readRef(input.api, repo, input.branch);
  }
  if (source.status === 401) return unauthorized();
  if (!input.forceBranch && source.sha && input.lastCommitSha && source.sha !== input.lastCommitSha) {
    return { ok: false, reason: "conflict", message: "The remote has new commits." };
  }

  let parent: string | null = null;
  let baseTree: string | undefined;
  if (source.status === 200 && source.sha) {
    parent = source.sha;
    const commit = await input.api.request<CommitBody>("GET", `/repos/${repo}/git/commits/${source.sha}`);
    if (commit.status === 401) return unauthorized();
    baseTree = commit.data.tree?.sha;
  }

  const diff = entries(input.files, input.lastManifest);
  if (diff.changed.length === 0 && diff.deleted.length === 0 && input.lastCommitSha) {
    return { ok: true, repo, commitSha: input.lastCommitSha, url: `https://github.com/${repo}/commit/${input.lastCommitSha}`, branch: target };
  }

  const tree: Record<string, unknown>[] = [];
  for (const file of diff.changed) {
    if (file.content.length > INLINE_LIMIT) {
      const blob = await input.api.request<{ sha?: string }>("POST", `/repos/${repo}/git/blobs`, {
        content: Buffer.from(file.content, "utf8").toString("base64"),
        encoding: "base64",
      });
      if (blob.status === 401) return unauthorized();
      tree.push({ path: file.path, mode: "100644", type: "blob", sha: blob.data.sha });
    } else {
      tree.push({ path: file.path, mode: "100644", type: "blob", content: file.content });
    }
  }
  for (const path of diff.deleted) tree.push({ path, mode: "100644", type: "blob", sha: null });

  const made = await input.api.request<TreeBody>("POST", `/repos/${repo}/git/trees`, { base_tree: baseTree, tree });
  if (made.status === 401) return unauthorized();
  if (!made.data.sha) return { ok: false, reason: "error", message: made.data.message ?? "GitHub could not write the tree." };

  const commit = await input.api.request<CommitBody>("POST", `/repos/${repo}/git/commits`, {
    message: input.message,
    tree: made.data.sha,
    parents: parent ? [parent] : [],
  });
  if (commit.status === 401) return unauthorized();
  if (!commit.data.sha) return { ok: false, reason: "error", message: commit.data.message ?? "GitHub could not create the commit." };

  const existing = target === input.branch ? source : await readRef(input.api, repo, target);
  if (existing.status === 401) return unauthorized();
  const updated =
    existing.status === 200
      ? await input.api.request<{ message?: string }>("PATCH", `/repos/${repo}/git/refs/heads/${encodeURIComponent(target)}`, { sha: commit.data.sha })
      : await input.api.request<{ message?: string }>("POST", `/repos/${repo}/git/refs`, { ref: `refs/heads/${target}`, sha: commit.data.sha });
  if (updated.status === 401) return unauthorized();
  if (updated.status === 422) return { ok: false, reason: "conflict", message: "The remote has new commits." };
  if (updated.status >= 300) return { ok: false, reason: "error", message: updated.data.message ?? "GitHub refused the update." };

  return { ok: true, repo, commitSha: commit.data.sha, url: `https://github.com/${repo}/commit/${commit.data.sha}`, branch: target };
}

export type TreeItem = { path?: string; type?: string; sha?: string; size?: number };

export async function listRemoteFiles(api: GitHubApi, repo: string, branch: string): Promise<{ ok: true; items: TreeItem[] } | { ok: false; status: number; message: string }> {
  const response = await api.request<{ tree?: TreeItem[]; truncated?: boolean; message?: string }>(
    "GET",
    `/repos/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );
  if (response.status === 401) return { ok: false, status: 401, message: "Reconnect GitHub." };
  if (response.status >= 300) return { ok: false, status: response.status, message: response.data.message ?? "GitHub could not read that repository." };
  if (response.data.truncated) return { ok: false, status: 413, message: "That repository is too large to import at once. Choose a subfolder." };
  return { ok: true, items: response.data.tree ?? [] };
}
