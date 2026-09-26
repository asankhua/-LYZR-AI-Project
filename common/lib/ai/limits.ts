const WINDOW_MS = 60_000;
const TOKEN_BUDGET = 200_000;

export function overBudget(tokensInWindow: number): boolean {
  return tokensInWindow >= TOKEN_BUDGET;
}

export function retryDelayMs(attempt: number, retryAfterHeader: string | null): number {
  const headerSeconds = Number(retryAfterHeader);
  if (Number.isFinite(headerSeconds) && headerSeconds > 0) return headerSeconds * 1000;
  return 1000 * 2 ** attempt;
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 3.5));
}

export function windowStart(now = Date.now()): number {
  return now - WINDOW_MS;
}
