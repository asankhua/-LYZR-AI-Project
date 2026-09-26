import { describe, expect, it } from "vitest";
import { filesForDeploy, mapReadyState, scriptedProgress } from "@/lib/deploy/prepare";

describe("deploy preparation", () => {
  it("maps Vercel ready states", () => {
    expect(mapReadyState("QUEUED")).toBe("queued");
    expect(mapReadyState("INITIALIZING")).toBe("queued");
    expect(mapReadyState("BUILDING")).toBe("building");
    expect(mapReadyState("READY")).toBe("ready");
    expect(mapReadyState("ERROR")).toBe("error");
    expect(mapReadyState("CANCELED")).toBe("canceled");
  });

  it("advances a scripted deploy and can fail", () => {
    const created = "2026-09-26T00:00:00.000Z";
    const start = Date.parse(created);
    expect(scriptedProgress(created, start + 1000, "ok").status).toBe("queued");
    expect(scriptedProgress(created, start + 4000, "ok").status).toBe("building");
    expect(scriptedProgress(created, start + 9000, "ok").status).toBe("ready");
    expect(scriptedProgress(created, start + 9000, "error").status).toBe("error");
  });

  it("strips the preview bridge and writes the public env", () => {
    const files = filesForDeploy(
      [
        { path: "index.html", content: "<div id=\"root\"></div>\n<script>\n(function () {\n  parent.postMessage({}, \"*\");\n})();\n</script>\n<script type=\"module\" src=\"/src/main.tsx\"></script>\n" },
        { path: "vite.config.ts", content: "function archSrc() {\n  return { name: \"arch-src\" };\n}\n\nexport default { plugins: [react(), archSrc()], server: { host: \"127.0.0.1\", port: 5173 } };\n" },
      ],
      { VITE_ARCHITECT_KEY: "abc", VITE_ARCHITECT_URL: "http://localhost:3000" },
    );
    const html = files.find((file) => file.path === "index.html")?.content ?? "";
    const config = files.find((file) => file.path === "vite.config.ts")?.content ?? "";
    const env = files.find((file) => file.path === ".env.production")?.content ?? "";
    expect(html).not.toContain("postMessage");
    expect(config).not.toContain("archSrc");
    expect(env).toContain("VITE_ARCHITECT_KEY=abc");
  });
});
