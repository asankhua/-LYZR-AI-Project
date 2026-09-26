export const CREDIT_TOKENS = 1000;
export const CREDIT_PRICE_USD = 0.02;

export type UsageEvent = {
  projectId: string | null;
  projectName?: string;
  stage: string;
  inputTokens: number;
  outputTokens: number;
};

export function summarizeUsage(events: UsageEvent[]) {
  let inputTokens = 0;
  let outputTokens = 0;
  const byStage = new Map<string, number>();
  const byProject = new Map<string, { name: string; tokens: number }>();
  for (const event of events) {
    const tokens = event.inputTokens + event.outputTokens;
    inputTokens += event.inputTokens;
    outputTokens += event.outputTokens;
    byStage.set(event.stage, (byStage.get(event.stage) ?? 0) + tokens);
    const key = event.projectId ?? "none";
    const row = byProject.get(key) ?? { name: event.projectName ?? "Untitled", tokens: 0 };
    row.tokens += tokens;
    byProject.set(key, row);
  }
  const tokens = inputTokens + outputTokens;
  return {
    totals: {
      inputTokens,
      outputTokens,
      tokens,
      credits: Math.round(tokens / CREDIT_TOKENS),
      costUsd: Number(((tokens / CREDIT_TOKENS) * CREDIT_PRICE_USD).toFixed(2)),
    },
    byStage: [...byStage.entries()].map(([stage, stageTokens]) => ({ stage, tokens: stageTokens })),
    byProject: [...byProject.values()],
  };
}
