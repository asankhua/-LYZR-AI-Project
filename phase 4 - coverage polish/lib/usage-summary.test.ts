import { describe, expect, it } from "vitest";
import { summarizeUsage } from "@/lib/usage-summary";

describe("usage summary", () => {
  it("rolls tokens into credits at a fixed price", () => {
    const summary = summarizeUsage([
      { projectId: "p1", projectName: "Travel Planner", stage: "plan", inputTokens: 800, outputTokens: 200 },
      { projectId: "p1", projectName: "Travel Planner", stage: "codegen", inputTokens: 1000, outputTokens: 1000 },
    ]);
    expect(summary.totals.tokens).toBe(3000);
    expect(summary.totals.credits).toBe(3);
    expect(summary.totals.costUsd).toBe(0.06);
    expect(summary.byStage).toEqual([
      { stage: "plan", tokens: 1000 },
      { stage: "codegen", tokens: 2000 },
    ]);
    expect(summary.byProject).toEqual([{ name: "Travel Planner", tokens: 3000 }]);
  });
});
