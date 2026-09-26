import type { StreamEvent } from "@/lib/types";

export function ndjsonResponse(handler: (send: (event: StreamEvent) => void, signal: AbortSignal) => Promise<void>, signal: AbortSignal) {
  const encoder = new TextEncoder();
  let closed = false;
  const stream = new ReadableStream({
    async start(controller) {
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          closed = true;
        }
      };
      const send = (event: StreamEvent) => {
        if (signal.aborted || closed) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          closed = true;
        }
      };
      try {
        await handler(send, signal);
      } catch (error) {
        if (!signal.aborted) {
          const message = error instanceof Error ? error.message : "The request failed.";
          send({ type: "error", message });
        }
      } finally {
        close();
      }
    },
    cancel() {
      closed = true;
    },
  });
  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson", "cache-control": "no-cache" },
  });
}

export async function readNdjson(response: Response, onEvent: (event: StreamEvent) => void) {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      onEvent(JSON.parse(line) as StreamEvent);
    }
  }
}
