import "server-only";

export async function broadcastDeploy(projectId: string, payload: { id: string; status: string; url: string | null }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return;
  await fetch(`${url}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ messages: [{ topic: `project:${projectId}`, event: "deploy", payload }] }),
  }).catch(() => undefined);
}
