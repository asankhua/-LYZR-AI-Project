import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ideasFor } from "@/lib/consultant-ideas";
import { MODELS, localModels } from "@/lib/ai/models";
import { getSession } from "@/lib/session";

const bodySchema = z.object({
  role: z.string().trim().min(1).max(80),
  timeSinks: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
  tools: z.array(z.string().trim().min(1).max(40)).max(12),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Tell us your role and what takes time." }, { status: 400 });

  const fallback = ideasFor(parsed.data);
  if (localModels()) return NextResponse.json({ ideas: fallback });

  try {
    const result = await generateText({
      model: createGroq({ apiKey: process.env.GROQ_API_KEY })(MODELS.fast),
      system: "Suggest three app ideas. Reply with JSON only: {\"ideas\":[{\"title\",\"description\",\"agents\":string[],\"hoursSavedPerWeek\":number,\"prompt\"}]}",
      prompt: JSON.stringify(parsed.data),
    });
    const match = result.text.match(/\{[\s\S]*\}/);
    const ideas = match ? (JSON.parse(match[0]) as { ideas?: unknown }).ideas : null;
    if (!Array.isArray(ideas) || ideas.length === 0) return NextResponse.json({ ideas: fallback });
    return NextResponse.json({ ideas });
  } catch (error) {
    console.warn("Consultant model call failed.", error);
    return NextResponse.json({ ideas: fallback });
  }
}
