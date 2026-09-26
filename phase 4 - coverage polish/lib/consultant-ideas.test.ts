import { describe, expect, it } from "vitest";
import { ideasFor } from "@/lib/consultant-ideas";

describe("consultant ideas", () => {
  it("uses the role and the first time sink", () => {
    const ideas = ideasFor({ role: "support lead", timeSinks: ["Refund replies"], tools: ["Zendesk"] });
    expect(ideas[0]?.prompt).toContain("support lead");
    expect(ideas[0]?.prompt).toContain("Refund replies");
    expect(ideas).toHaveLength(3);
  });
});
