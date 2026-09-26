import { describe, expect, it } from "vitest";
import { filterPrompts } from "@/lib/prompts/library";

describe("prompt library", () => {
  it("filters by role and task", () => {
    const matches = filterPrompts("Sales", "Write");
    expect(matches.map((item) => item.title)).toEqual(["First email"]);
  });
});
