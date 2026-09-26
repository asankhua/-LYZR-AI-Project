import { NextResponse } from "next/server";
import { z } from "zod";
import { sampleRun } from "@/lib/ai/draft";
import { appOrigins, corsOriginAllowed, limitDecision, originAllowed } from "@/lib/security/access";
import { deploymentOrigins, findProjectByKey, projectHasAgent, recentPublicHits, recordPublicHit, saveDeployedRun } from "@/lib/ship/data";

export const maxDuration = 60;

const bodySchema = z.object({
  agentName: z.string().min(1).max(80),
  input: z.string().min(1).max(4000),
});

function headersFor(origin: string | null, reflect: boolean) {
  const headers = new Headers();
  if (origin && reflect) {
    headers.set("access-control-allow-origin", origin);
    headers.set("vary", "origin");
  }
  headers.set("access-control-allow-headers", "content-type, x-architect-key");
  headers.set("access-control-allow-methods", "POST, OPTIONS");
  return headers;
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new NextResponse(null, { status: 204, headers: headersFor(origin, corsOriginAllowed(origin, appUrl)) });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const reflect = corsOriginAllowed(origin, appUrl);
  const key = request.headers.get("x-architect-key") ?? "";
  const found = key ? await findProjectByKey(key) : null;
  if (!found) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: headersFor(origin, reflect) });
  const allowed = appOrigins(appUrl, await deploymentOrigins(found.project.id));
  if (!originAllowed(origin, allowed)) return NextResponse.json({ error: "Origin is not allowed." }, { status: 403, headers: headersFor(origin, reflect) });
  const hits = await recentPublicHits(found.project.id);
  const decision = limitDecision(hits, Date.now());
  if (!decision.ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { ...Object.fromEntries(headersFor(origin, reflect)), "retry-after": String(decision.retryAfter) } });
  }
  await recordPublicHit(found.project.id, found.project.ownerId);
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: headersFor(origin, reflect) });
  const exists = await projectHasAgent(found.project.id, parsed.data.agentName);
  if (!exists) return NextResponse.json({ error: "Agent not found" }, { status: 404, headers: headersFor(origin, reflect) });
  const sample = sampleRun(parsed.data.agentName, parsed.data.input);
  const runId = crypto.randomUUID();
  await saveDeployedRun({
    id: runId,
    projectId: found.project.id,
    agentName: parsed.data.agentName,
    input: parsed.data.input,
    output: sample.output,
    steps: sample.steps,
    inputTokens: Math.ceil(parsed.data.input.length / 4),
    outputTokens: Math.ceil(sample.output.length / 4),
    durationMs: 1,
  });
  return NextResponse.json({ output: sample.output, runId }, { headers: headersFor(origin, reflect) });
}
