export const PUBLIC_RATE_LIMIT = 30;
export const PUBLIC_WINDOW_MS = 60_000;
export const DEPLOY_DAILY_LIMIT = 5;

export function limitDecision(stamps: number[], now: number, limit = PUBLIC_RATE_LIMIT, windowMs = PUBLIC_WINDOW_MS) {
  const recent = stamps.filter((stamp) => now - stamp < windowMs);
  if (recent.length >= limit) {
    const oldest = Math.min(...recent);
    return { ok: false as const, retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }
  return { ok: true as const, retryAfter: 0 };
}

export function deployLimitReached(timestamps: string[], now: number) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return timestamps.filter((stamp) => Date.parse(stamp) >= start.getTime()).length >= DEPLOY_DAILY_LIMIT;
}

export function originAllowed(origin: string | null, allowed: string[]): boolean {
  if (!origin) return false;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  if (parsed.hostname.endsWith(".webcontainer-api.io")) return true;
  return allowed.some((item) => {
    try {
      return new URL(item).origin === parsed.origin;
    } catch {
      return item === origin;
    }
  });
}

export function corsOriginAllowed(origin: string | null, appUrl: string): boolean {
  if (originAllowed(origin, [appUrl, "http://localhost:3000", "http://127.0.0.1:3000"])) return true;
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

export function appOrigins(appUrl: string, deploymentUrls: string[]) {
  return [appUrl, "http://localhost:3000", "http://127.0.0.1:3000", ...deploymentUrls].filter(Boolean);
}
