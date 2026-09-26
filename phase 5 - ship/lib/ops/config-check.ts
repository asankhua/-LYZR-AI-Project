import "server-only";
import { checkModels } from "@/lib/ai/models";

const required = ["GROQ_API_KEY", "NEXT_PUBLIC_APP_URL"] as const;

export async function checkConfig() {
  for (const name of required) {
    if (!process.env[name]) console.warn(`Config: ${name} is empty. The demo store still runs.`);
  }
  await checkModels();
}
