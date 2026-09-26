import { readNdjson } from "@/lib/ndjson";
import type { StreamEvent } from "@/lib/types";

export async function postEvents(
  url: string,
  body: unknown,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "2");
      onEvent({ type: "step", label: `Too many requests. Retrying in ${retryAfter}s.`, status: "running" });
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, retryAfter) * 1000));
      continue;
    }
    if (!response.ok) {
      onEvent({ type: "error", message: "The request failed." });
      return;
    }
    await readNdjson(response, onEvent);
    return;
  }
  onEvent({ type: "error", message: "Still rate limited. Try again in a minute." });
}
