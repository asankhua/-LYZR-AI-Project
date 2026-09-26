import "server-only";

export const MODELS = {
  reasoning: "openai/gpt-oss-120b",
  fast: "openai/gpt-oss-20b",
  research: "groq/compound-mini",
  transcribe: "whisper-large-v3-turbo",
} as const;

let checked = false;

export function localModels(): boolean {
  return process.env.ARCHITECT_AI === "local" || !process.env.GROQ_API_KEY;
}

export async function checkModels(): Promise<void> {
  if (checked || localModels()) return;
  checked = true;
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    });
    if (!response.ok) {
      console.warn(`Groq model check failed (${response.status}).`);
      return;
    }
    const body = (await response.json()) as { data?: { id: string }[] };
    const ids = new Set((body.data ?? []).map((model) => model.id));
    for (const id of Object.values(MODELS)) {
      if (!ids.has(id)) console.warn(`Configured Groq model is not listed: ${id}`);
    }
  } catch (error) {
    console.warn("Groq model check could not run.", error);
  }
}
