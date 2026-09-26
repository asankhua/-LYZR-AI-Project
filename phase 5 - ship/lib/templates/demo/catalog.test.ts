import { describe, expect, it } from "vitest";
import { guestBundles } from "@/lib/templates/demo/catalog";

describe("guest demo catalog", () => {
  const bundles = guestBundles();

  it("seeds the three reviewer projects", () => {
    expect(bundles.map((bundle) => bundle.name)).toEqual([
      "Travel Planner",
      "Support Desk",
      "Lead Research Assistant",
    ]);
  });

  it("gives Travel Planner a plan, four agents, files, and nine snapshots", () => {
    const travel = bundles[0];
    expect(travel.stage).toBe("build");
    expect(travel.approved).toBe(true);
    expect(travel.plan.screens.length).toBeGreaterThan(0);
    expect(travel.plan.agents).toHaveLength(4);
    expect(travel.agents.map((agent) => agent.name)).toEqual([
      "Trip Manager",
      "Flight Finder",
      "Hotel Scout",
      "Itinerary Writer",
    ]);
    expect(travel.files.some((file) => file.path === "package.json")).toBe(true);
    expect(travel.files.some((file) => file.path.endsWith("data.json"))).toBe(true);
    expect(travel.snapshots).toHaveLength(9);
    expect(travel.snapshots.filter((snapshot) => !snapshot.healthy)).toHaveLength(1);
    const tokens = travel.usage.reduce((sum, row) => sum + row.inputTokens + row.outputTokens, 0);
    expect(tokens).toBe(8000);
  });

  it("shows Support Desk as live and Lead Research still on the plan", () => {
    expect(bundles[1].stage).toBe("ship");
    expect(bundles[1].deployments.filter((item) => item.status === "ready").length).toBeGreaterThan(1);
    expect(bundles[2].stage).toBe("plan");
    expect(bundles[2].approved).toBe(false);
    expect(bundles[2].agents).toHaveLength(0);
    expect(bundles[2].files).toHaveLength(0);
  });
});