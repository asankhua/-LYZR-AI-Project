import { describe, expect, it } from "vitest";
import { draftPlan, filesForPlan } from "@/lib/ai/draft";
import { previewDocument, previewHasScreen } from "@/lib/runtime/preview-document";

describe("preview document", () => {
  it("renders the generated screen instead of a text-only note", () => {
    const plan = draftPlan("A landing page for a bookstore");
    const files = filesForPlan(plan);
    expect(previewHasScreen(files)).toBe(true);
    const html = previewDocument(files);
    expect(html).toContain("<h1>Landing Page For A Bookstore</h1>");
    expect(html).toContain("Get started");
    expect(html).toContain("<h2>Recent list</h2>");
    expect(html).toContain("Manager");
    expect(html).toContain("data-arch-note=\"summary\"");
    expect(html).not.toContain("const blocks");
  });
});
