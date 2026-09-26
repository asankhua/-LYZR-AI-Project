import { describe, expect, it } from "vitest";
import { corsOriginAllowed, deployLimitReached, limitDecision, originAllowed } from "@/lib/security/access";

describe("public access rules", () => {
  it("allows 30 calls in a minute and refuses the next", () => {
    const now = 1_000_000;
    const stamps = Array.from({ length: 30 }, (_, index) => now - index * 1000);
    expect(limitDecision(stamps, now).ok).toBe(false);
    expect(limitDecision(stamps.slice(0, 29), now).ok).toBe(true);
  });

  it("refuses a foreign origin and allows the app, preview, and deployment", () => {
    const allowed = ["http://localhost:3000", "https://travel-planner.vercel.app"];
    expect(originAllowed("https://evil.example", allowed)).toBe(false);
    expect(originAllowed(null, allowed)).toBe(false);
    expect(originAllowed("http://localhost:3000", allowed)).toBe(true);
    expect(originAllowed("https://abc.local-corp.webcontainer-api.io", allowed)).toBe(true);
    expect(originAllowed("https://travel-planner.vercel.app", allowed)).toBe(true);
  });

  it("counts deploys since local midnight", () => {
    const now = Date.parse("2026-09-26T15:00:00.000Z");
    const earlier = new Date(now);
    earlier.setHours(0, 0, 0, 0);
    const stamps = Array.from({ length: 5 }, () => new Date(earlier.getTime() + 1000).toISOString());
    expect(deployLimitReached(stamps, now)).toBe(true);
    expect(deployLimitReached(stamps.slice(0, 4), now)).toBe(false);
  });

  it("reflects vercel origins for CORS and still names evil hosts", () => {
    expect(corsOriginAllowed("https://evil.example", "http://localhost:3000")).toBe(false);
    expect(corsOriginAllowed("https://app.vercel.app", "http://localhost:3000")).toBe(true);
  });
});
