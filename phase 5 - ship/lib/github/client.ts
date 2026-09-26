import "server-only";
import type { GitHubApi } from "@/lib/github/sync";

export function githubApi(token?: string | null): GitHubApi {
  return {
    async request<T = Record<string, unknown>>(method: string, path: string, body?: unknown) {
      const response = await fetch(`https://api.github.com${path}`, {
        method,
        headers: {
          accept: "application/vnd.github+json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          "user-agent": "architect",
          "x-github-api-version": "2022-11-28",
          ...(body === undefined ? {} : { "content-type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
      return { status: response.status, data: data as T };
    },
  };
}

export async function githubLogin(token: string): Promise<string | null> {
  const response = await githubApi(token).request<{ login?: string }>("GET", "/user");
  return response.status === 200 ? response.data.login ?? null : null;
}
