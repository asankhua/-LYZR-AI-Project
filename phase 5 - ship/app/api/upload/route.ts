import { NextResponse } from "next/server";
import { demoAddKnowledge } from "@/lib/demo/store";
import { extractText } from "@/lib/knowledge/extract";
import { getSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Files must be 5 MB or smaller." }, { status: 413 });
  const text = extractText({ name: file.name, type: file.type, bytes: Buffer.from(await file.arrayBuffer()) });
  if (!isSupabaseConfigured()) await demoAddKnowledge({ userId: session.id, name: file.name, text });
  return NextResponse.json({ path: file.name, extractedChars: text.length });
}
