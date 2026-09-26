import { describe, expect, it } from "vitest";
import { greetingFor, projectNameFromPrompt } from "@/lib/utils";

describe("projectNameFromPrompt", () => {
  it("turns the first words into a title", () => {
    expect(projectNameFromPrompt("build a travel planner for groups")).toBe("Travel Planner For Groups");
  });

  it("drops punctuation and extra words", () => {
    expect(projectNameFromPrompt("Invoice analyzer!!! that flags mismatches and emails finance weekly")).toBe(
      "Invoice Analyzer That Flags Mismatches And",
    );
  });

  it("falls back when the prompt is empty", () => {
    expect(projectNameFromPrompt("   ??? ")).toBe("Untitled app");
  });
});

describe("greetingFor", () => {
  it("follows the time of day", () => {
    expect(greetingFor(new Date("2026-09-25T08:00:00"))).toBe("Good morning");
    expect(greetingFor(new Date("2026-09-25T15:00:00"))).toBe("Good afternoon");
    expect(greetingFor(new Date("2026-09-25T21:00:00"))).toBe("Good evening");
  });
});
