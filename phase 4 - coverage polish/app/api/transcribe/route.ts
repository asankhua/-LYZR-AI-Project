import { NextResponse } from "next/server";
import { localModels } from "@/lib/ai/models";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (localModels() || !(audio instanceof File)) {
    return NextResponse.json({ text: "A receipt scanner for a small shop" });
  }
  const body = new FormData();
  body.set("file", audio, "prompt.webm");
  body.set("model", "whisper-large-v3-turbo");
  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body,
  });
  if (!response.ok) return NextResponse.json({ error: "Transcription failed." }, { status: 502 });
  const payload = (await response.json()) as { text?: string };
  return NextResponse.json({ text: payload.text ?? "" });
}
