import { afterEach, describe, expect, it, vi } from "vitest";
import { postEvents } from "@/lib/client-stream";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("postEvents", () => {
  it("shows a retry card and then reads the stream", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) return new Response("{}", { status: 429, headers: { "retry-after": "0" } });
        return new Response(`${JSON.stringify({ type: "text", text: "ready" })}\n`, { status: 200 });
      }),
    );
    const events: string[] = [];
    await postEvents("/api/plan", {}, (event) => {
      if (event.type === "step") events.push(event.label);
      if (event.type === "text") events.push(event.text);
    });
    expect(events).toEqual(["Too many requests. Retrying in 0s.", "ready"]);
  });
});