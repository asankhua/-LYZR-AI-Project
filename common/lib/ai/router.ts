export type IntentName = "plan" | "build" | "test" | "chat";

export function classifyIntent(message: string): { intent: IntentName; confidence: number } {
  const text = message.toLowerCase();
  if (/\b(test|sample)\b/.test(text)) return { intent: "test", confidence: 0.8 };
  if (/\b(build|generate|code|file)\b/.test(text)) return { intent: "build", confidence: 0.8 };
  if (/\b(plan|screen|audience|change)\b/.test(text)) return { intent: "plan", confidence: 0.75 };
  return { intent: "chat", confidence: 0.55 };
}
