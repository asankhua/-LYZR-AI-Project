import type { DeploymentStatus } from "@/lib/types";

export function mapReadyState(state: string): DeploymentStatus {
  if (state === "READY") return "ready";
  if (state === "BUILDING") return "building";
  if (state === "ERROR") return "error";
  if (state === "CANCELED") return "canceled";
  return "queued";
}

export function scriptedProgress(createdAt: string, now: number, outcome: "ok" | "error"): { status: DeploymentStatus; logs: string } {
  const age = now - Date.parse(createdAt);
  const queued = "Queued the deployment.\n";
  const building = `${queued}Installing dependencies.\nRunning vite build.\n`;
  if (age < 3000) return { status: "queued", logs: queued };
  if (age < 8000) return { status: "building", logs: building };
  if (outcome === "error") return { status: "error", logs: `${building}Error: vite build failed.\n` };
  return { status: "ready", logs: `${building}Ready.\n` };
}

export function filesForDeploy(files: { path: string; content: string }[], env: Record<string, string>) {
  const prepared = files.map((file) => {
    if (file.path === "index.html") {
      return { ...file, content: file.content.replace(/<script>\s*\(function \(\) \{[\s\S]*?\}\)\(\);\s*<\/script>\s*/, "") };
    }
    if (file.path === "vite.config.ts") {
      return {
        ...file,
        content: file.content
          .replace(/function archSrc\(\) \{[\s\S]*?\n\}\n\n/, "")
          .replace("plugins: [react(), archSrc()]", "plugins: [react()]")
          .replace(/\n\s*server: \{ host: "127\.0\.0\.1", port: 5173 \},?/, ""),
      };
    }
    return file;
  });
  const body = `${Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")}\n`;
  return [...prepared, { path: ".env.production", content: body }];
}

export function deploymentUrl(subdomain: string) {
  return `https://${subdomain}.vercel.app`;
}

export function suggestSubdomain(slug: string) {
  return `${slug.slice(0, 28)}-2`;
}
