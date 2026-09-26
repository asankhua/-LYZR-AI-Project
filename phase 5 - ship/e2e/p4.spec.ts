import { expect, test } from "@playwright/test";
import { auditDesign } from "../../common/scripts/design-audit";

test("coverage screens are reachable", async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Try without an account" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Privacy" })).toBeVisible();
  const start = page.getByRole("link", { name: "Start building" });
  await expect(start).toHaveCSS("background-color", "rgb(79, 70, 229)");
  const landing = await auditDesign(page);
  expect(landing.unlabelledIconButtons).toBe(0);

  await page.goto("/try");
  await expect(page.getByRole("heading", { name: "What do you want to build?" })).toBeVisible();
  await page.getByRole("link", { name: "Open the consultant" }).click();
  await expect(page.getByRole("heading", { name: "What takes up most of your week?" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Refund replies assistant" })).toBeVisible();
  await page.getByRole("button", { name: "Use this" }).first().click();
  await expect(page).toHaveURL(/\/home/);
  await expect(page.getByRole("heading", { name: "Refund replies assistant" })).toBeVisible();
  const prompt = page.getByPlaceholder(/Describe your app/);
  await expect(prompt).toHaveValue(/Support lead/);

  await page.getByRole("button", { name: "Add to prompt" }).click();
  await page.getByRole("menuitem", { name: "Prompt library" }).click();
  await expect(page.getByRole("dialog", { name: "Prompt library" })).toBeVisible();
  await page.getByRole("button", { name: /Ticket reply/ }).click();
  await expect(prompt).toHaveValue(/refund/);

  await page.getByRole("button", { name: "Voice prompt" }).click();
  await expect(prompt).toHaveValue("A receipt scanner for a small shop");

  await page.locator("#prompt-file").setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Refund policy for late shipments."),
  });
  await expect(page.getByText(/characters extracted/)).toBeVisible();

  await page.getByLabel("Stack").selectOption("next");
  await expect(page.getByText("That stack scaffolds files only.")).toBeVisible();

  await page.getByRole("link", { name: "Templates", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Templates" })).toBeVisible();
  await page.getByRole("tab", { name: "Support" }).click();

  await page.getByRole("link", { name: "Marketplace", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Marketplace" })).toBeVisible();

  await page.getByRole("link", { name: "Usage", exact: true }).click();
  await expect(page.getByRole("paragraph").filter({ hasText: "8,000" })).toBeVisible();
  await page.goto("/usage?preview=limit");
  await expect(page.getByRole("heading", { name: "You are near the rate limit" })).toBeVisible();

  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByRole("navigation", { name: "Settings" }).getByRole("button", { name: "Mode", exact: true }).click();
  await page.getByRole("button", { name: "Use dark mode" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);

  await page.getByRole("button", { name: "Notifications" }).click();
  await expect(page.getByText("Build finished")).toBeVisible();

  await page.getByRole("button", { name: /Search projects/ }).click();
  const search = page.getByRole("dialog", { name: "Search" });
  await expect(search).toBeVisible();
  await search.getByPlaceholder("Search projects, templates, commands").fill("API");
  await search.getByRole("option", { name: "API and CLI" }).click();
  await expect(page.getByRole("heading", { name: "API and CLI" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Branch previews" })).toBeVisible();

  await page.goto("/home");
  await expect(page.getByRole("link", { name: /Support Desk/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Lead Research Assistant/ })).toBeVisible();
  await page.getByRole("link", { name: /Travel Planner/ }).click();
  await expect(page).toHaveURL(/\/p\//);
  await page.getByRole("button", { name: "Dismiss" }).click();
  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByRole("heading", { name: /Share Travel Planner/ })).toBeVisible();
  await page.getByLabel("Email").fill("teammate@acme.com");
  await page.getByRole("button", { name: "Invite" }).click();
  await expect(page.getByText("Invite noted for teammate@acme.com")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Switch to Developer mode" }).click();
  await expect(page.getByRole("tab", { name: "Database" })).toBeVisible();
  await page.getByRole("tab", { name: "Database" }).click();
  await expect(page.getByRole("heading", { name: "Trips" })).toBeVisible();
  await page.getByRole("tab", { name: "Env" }).click();
  await page.getByLabel("Value").fill("secret-key");
  await page.getByRole("button", { name: "Add variable" }).click();
  await expect(page.getByText("VITE_ARCHITECT_KEY")).toBeVisible();

  await page.getByRole("tab", { name: "Agents" }).click();
  await page.getByRole("button", { name: "Open in Lyzr Studio" }).click();
  await expect(page.getByText("Open in Lyzr Studio is a preview link.")).toBeVisible();

  await page.getByRole("button", { name: "Artifacts" }).click();
  await expect(page.getByRole("heading", { name: "Artifacts" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("tab", { name: "Git" }).click();
  await expect(page.getByRole("heading", { name: "Branch previews" })).toBeVisible();

  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible();
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Terms" })).toBeVisible();
  await page.goto("/missing-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("mobile workspace switches between chat and preview", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/try");
  await page.getByRole("link", { name: /Travel Planner/ }).click();
  await expect(page.getByRole("button", { name: "Chat" })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(async () => {
    await page.getByRole("button", { name: "Preview" }).click();
    await expect(page.getByRole("tab", { name: "Plan" })).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
});
