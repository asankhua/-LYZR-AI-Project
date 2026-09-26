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
    expect(html).toContain('type="search"');
    expect(html).toContain("Recent list");
    expect(html).toContain("Staff picks");
    expect(html).toContain("Manager");
    expect(html).toContain("data-arch-note=\"summary\"");
    expect(html).not.toContain("For you");
  });

  it("renders a search field and scrolling cards for an older file set", () => {
    const html = previewDocument([
      {
        path: "src/pages/Home.tsx",
        content: `const blocks = ${JSON.stringify([
          { name: "Search Bar", purpose: "Ask a question and view recent popular queries.", kind: "section" },
          { name: "Recent Questions List", purpose: "Ask a question and view recent popular queries.", kind: "grid" },
        ])};`,
      },
      { path: "src/App.tsx", content: 'const summary = "Answers repeated questions."; title={"Knowledge Base"}' },
      { path: "src/lib/agents.ts", content: 'name: "Helper", role: "Looks up answers"' },
    ]);
    expect(html).toContain('type="search"');
    expect(html).toContain("Search Bar");
    expect(html).toContain("Recent Questions List");
    expect(html).toContain("Helper");
    expect(html).not.toContain("For you");
  });
});
