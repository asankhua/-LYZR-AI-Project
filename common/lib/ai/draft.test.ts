import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { draftAgents, draftPlan, filesForPlan, PLAN_SECTIONS } from "@/lib/ai/draft";
import { parseWithOneRetry, planSchema } from "@/lib/ai/schemas";
import { overBudget, retryDelayMs } from "@/lib/ai/limits";

const prompts = [
  "A receipt scanner for a small shop",
  "Weekly market digest for a founder",
  "Candidate screening notes for a recruiter",
  "Invoice checker for a finance lead",
  "Customer questions answered from our docs",
];

describe("plan drafts", () => {
  it("gives every golden prompt a complete plan and a manager", () => {
    for (const prompt of prompts) {
      const plan = planSchema.parse(draftPlan(prompt));
      for (const section of PLAN_SECTIONS) expect(plan[section]).toBeDefined();
      const agents = draftAgents("project", plan);
      expect(agents.some((agent) => agent.managedBy === null)).toBe(true);
      expect(agents.some((agent) => agent.managedBy)).toBe(true);
    }
  });

  it("repairs one invalid tool payload", () => {
    const broken = { title: "App" };
    const fixed = parseWithOneRetry(broken, planSchema, () => draftPlan("A receipt scanner"));
    expect(fixed.title).toBe("Receipt Scanner");
  });

  it("flags a full token window and honors retry-after", () => {
    expect(overBudget(200_000)).toBe(true);
    expect(overBudget(10)).toBe(false);
    expect(retryDelayMs(1, "3")).toBe(3000);
    expect(retryDelayMs(2, null)).toBe(4000);
  });
});

describe("generated files", () => {
  it("typechecks", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "architect-files-"));
    for (const file of filesForPlan(draftPlan("A receipt scanner for a small shop"))) {
      const full = path.join(dir, file.path);
      mkdirSync(path.dirname(full), { recursive: true });
      writeFileSync(full, file.content);
    }
    try {
      execFileSync("pnpm", ["exec", "tsc", "-p", path.join(dir, "tsconfig.json"), "--pretty", "false"], {
        cwd: process.cwd(),
        stdio: "pipe",
      });
    } catch (error) {
      const failure = error as { stdout?: Buffer; stderr?: Buffer };
      throw new Error(`${failure.stdout?.toString() ?? ""}\n${failure.stderr?.toString() ?? ""}`);
    }
  });
});
