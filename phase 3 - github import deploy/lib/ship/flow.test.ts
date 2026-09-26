import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStoredZip } from "@/lib/import/zip";

const jar = new Map<string, string>();

function zipFile(name: string, archive: Buffer) {
  const copy = new ArrayBuffer(archive.byteLength);
  new Uint8Array(copy).set(archive);
  return new File([copy], name, { type: "application/zip" });
}

async function responseOf(value: Response | undefined) {
  if (!value) throw new Error("Route returned no response");
  return value;
}

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get(name: string) {
      const value = jar.get(name);
      return value ? { value } : undefined;
    },
    set(name: string, value: string) {
      jar.set(name, value);
    },
  }),
}));

describe("guest ship flow", () => {
  beforeEach(() => {
    jar.clear();
  });

  it("imports a zip, blocks deploy, and rate-limits the public agent API", async () => {
    const { startDemoSession } = await import("@/lib/session");
    const { POST: importZip } = await import("@/app/api/import/zip/route");
    const { GET: gitState } = await import("@/app/api/github/state/route");
    const { POST: deploy } = await import("@/app/api/deploy/route");
    const { POST: runAgent } = await import("@/app/api/public/agents/run/route");
    await startDemoSession();

    const archive = createStoredZip([
      { path: "README.md", content: "# Notes\n" },
      { path: "notes.txt", content: "hello\n" },
    ]);
    const form = new FormData();
    form.set("file", zipFile("notes.zip", archive));
    const imported = await responseOf(await importZip(new Request("http://localhost/api/import/zip", { method: "POST", body: form })));
    expect(imported.status).toBe(200);
    const body = (await imported.json()) as { projectId: string; codeOnly: boolean };
    expect(body.codeOnly).toBe(true);

    const stateResponse = await responseOf(await gitState(new Request(`http://localhost/api/github/state?projectId=${body.projectId}`)));
    const state = (await stateResponse.json()) as { guest: boolean; connected: boolean; publicKey: string };
    expect(state.guest).toBe(true);
    expect(state.connected).toBe(false);

    const blocked = await responseOf(await deploy(
      new Request("http://localhost/api/deploy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId: body.projectId, subdomain: "guest-notes" }),
      }),
    ));
    expect(blocked.status).toBe(403);

    const wrong = await responseOf(await runAgent(
      new Request("http://localhost/api/public/agents/run", {
        method: "POST",
        headers: { origin: "http://localhost:3000", "content-type": "application/json", "x-architect-key": "not-a-real-key" },
        body: JSON.stringify({ agentName: "Manager", input: "hello" }),
      }),
    ));
    expect(wrong.status).toBe(401);

    const foreign = await responseOf(await runAgent(
      new Request("http://localhost/api/public/agents/run", {
        method: "POST",
        headers: { origin: "https://evil.example", "content-type": "application/json", "x-architect-key": state.publicKey },
        body: JSON.stringify({ agentName: "Manager", input: "hello" }),
      }),
    ));
    expect(foreign.status).toBe(403);

    let status = 0;
    for (let attempt = 0; attempt < 31; attempt += 1) {
      const response = await responseOf(await runAgent(
        new Request("http://localhost/api/public/agents/run", {
          method: "POST",
          headers: { origin: "http://localhost:3000", "content-type": "application/json", "x-architect-key": state.publicKey },
          body: JSON.stringify({ agentName: "Manager", input: "hello" }),
        }),
      ));
      status = response.status;
    }
    expect(status).toBe(429);

    const huge = new FormData();
    huge.set("file", new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.zip", { type: "application/zip" }));
    const oversized = await responseOf(await importZip(new Request("http://localhost/api/import/zip", { method: "POST", body: huge })));
    expect(oversized.status).toBe(413);
  });

  it("starts a scripted deploy for a signed-in user when Vercel is not configured", async () => {
    const { startDemoSession, getSession } = await import("@/lib/session");
    const { mutateDemo } = await import("@/lib/demo/store");
    const { POST: importZip } = await import("@/app/api/import/zip/route");
    const { POST: deploy } = await import("@/app/api/deploy/route");
    const { GET: status } = await import("@/app/api/deploy/[id]/status/route");
    await startDemoSession();
    const session = await getSession();
    await mutateDemo((store) => {
      const profile = store.profiles.find((item) => item.id === session?.id);
      if (profile) profile.isAnonymous = false;
    });
    const form = new FormData();
    form.set(
      "file",
      zipFile("planner.zip", createStoredZip([{ path: "README.md", content: "# App\n" }])),
    );
    const imported = await responseOf(await importZip(new Request("http://localhost/api/import/zip", { method: "POST", body: form })));
    const { projectId } = (await imported.json()) as { projectId: string };
    const created = await responseOf(await deploy(
      new Request("http://localhost/api/deploy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, subdomain: `planner-${Date.now().toString(36)}` }),
      }),
    ));
    expect(created.status).toBe(200);
    const { deploymentId } = (await created.json()) as { deploymentId: string };
    const polled = await responseOf(await status(new Request(`http://localhost/api/deploy/${deploymentId}/status`), { params: Promise.resolve({ id: deploymentId }) }));
    expect(polled.status).toBe(200);
    const body = (await polled.json()) as { status: string };
    expect(body.status).toBe("queued");
  });
});
