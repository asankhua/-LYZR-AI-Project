import { describe, expect, it } from "vitest";
import { syncRepository, type GitHubApi } from "@/lib/github/sync";

function fakeApi(handler: (method: string, path: string, body?: unknown) => { status: number; data: Record<string, unknown> }): GitHubApi {
  return {
    request: async (method, path, body) => handler(method, path, body) as { status: number; data: never },
  };
}

const file = { path: "src/App.tsx", content: "export const App = 1;\n", sha: "abc" };

describe("github sync", () => {
  it("creates a repository and commits the files", async () => {
    const calls: string[] = [];
    const result = await syncRepository({
      api: fakeApi((method, path) => {
        calls.push(`${method} ${path}`);
        if (path === "/user/repos") return { status: 201, data: { full_name: "ada/travel-planner" } };
        if (path.includes("/git/ref/")) return { status: 200, data: { object: { sha: "base" } } };
        if (path.includes("/git/commits/base")) return { status: 200, data: { tree: { sha: "tree0" } } };
        if (path.endsWith("/git/trees")) return { status: 201, data: { sha: "tree1" } };
        if (path.endsWith("/git/commits")) return { status: 201, data: { sha: "commit1" } };
        if (method === "PATCH") return { status: 200, data: {} };
        return { status: 500, data: {} };
      }),
      repo: null,
      repoName: "travel-planner",
      isPrivate: true,
      branch: "main",
      message: "Update from Architect",
      files: [file],
      lastManifest: null,
      lastCommitSha: null,
      wait: async () => undefined,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.commitSha).toBe("commit1");
    expect(calls.some((call) => call.startsWith("POST /user/repos"))).toBe(true);
  });

  it("reports a conflict when the remote moved", async () => {
    const result = await syncRepository({
      api: fakeApi((_method, path) => {
        if (path.includes("/git/ref/")) return { status: 200, data: { object: { sha: "remote" } } };
        return { status: 500, data: {} };
      }),
      repo: "ada/travel-planner",
      repoName: "travel-planner",
      isPrivate: true,
      branch: "main",
      message: "Update from Architect",
      files: [file],
      lastManifest: { "src/App.tsx": "old" },
      lastCommitSha: "local",
    });
    expect(result).toMatchObject({ ok: false, reason: "conflict" });
  });

  it("reports an expired token", async () => {
    const result = await syncRepository({
      api: fakeApi(() => ({ status: 401, data: { message: "Bad credentials" } })),
      repo: "ada/travel-planner",
      repoName: "travel-planner",
      isPrivate: true,
      branch: "main",
      message: "Update from Architect",
      files: [file],
      lastManifest: null,
      lastCommitSha: null,
    });
    expect(result).toMatchObject({ ok: false, reason: "unauthorized" });
  });

  it("pushes the same tree onto a new branch after a conflict", async () => {
    const result = await syncRepository({
      api: fakeApi((method, path) => {
        if (path.endsWith("/heads/main")) return { status: 200, data: { object: { sha: "remote" } } };
        if (path.endsWith("/heads/architect-sync")) return { status: 404, data: {} };
        if (path.includes("/git/commits/remote")) return { status: 200, data: { tree: { sha: "tree0" } } };
        if (path.endsWith("/git/trees")) return { status: 201, data: { sha: "tree1" } };
        if (path.endsWith("/git/commits")) return { status: 201, data: { sha: "commit2" } };
        if (method === "POST" && path.endsWith("/git/refs")) return { status: 201, data: {} };
        return { status: 500, data: { message: path } };
      }),
      repo: "ada/travel-planner",
      repoName: "travel-planner",
      isPrivate: true,
      branch: "main",
      forceBranch: "architect-sync",
      message: "Update from Architect",
      files: [file],
      lastManifest: { "src/App.tsx": "old" },
      lastCommitSha: "local",
    });
    expect(result).toMatchObject({ ok: true, branch: "architect-sync", commitSha: "commit2" });
  });
});
