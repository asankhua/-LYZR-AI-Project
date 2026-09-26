import { expect, test } from "@playwright/test";

test("guest walks the seeded projects across every stage", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/try");
  await expect(page.getByRole("heading", { name: "What do you want to build?" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Travel Planner/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Support Desk/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Lead Research Assistant/ })).toBeVisible();

  await page.getByRole("link", { name: /Travel Planner/ }).click();
  await expect(page).toHaveURL(/\/p\//);
  await page.getByRole("button", { name: "Dismiss" }).click();
  await page.getByRole("tab", { name: "Plan" }).click();
  await expect(page.getByRole("textbox", { name: "Who it's for" })).toHaveValue("Friends planning a trip together");
  await expect(page.getByRole("tab", { name: "Agents" })).toBeVisible();
  await page.getByRole("tab", { name: "Agents" }).click();
  await expect(page.getByText("Trip Manager")).toBeVisible();

  await page.getByRole("tab", { name: "Preview" }).click();
  await expect(page.getByRole("contentinfo").getByText("Preview ready")).toBeVisible({ timeout: 150_000 });
  const frame = page.frameLocator('iframe[title="App preview"]');
  await expect(frame.getByRole("heading", { name: "Travel Planner" })).toBeVisible({ timeout: 30_000 });

  await page.getByRole("link", { name: /History/ }).click();
  await expect(page.getByText("Runtime error while splitting costs")).toBeVisible();

  await page.goBack();
  await page.getByRole("button", { name: "Switch to Developer mode" }).click();
  await page.getByRole("tab", { name: "Git" }).click();
  await expect(page.getByRole("heading", { name: "GitHub is not connected" })).toBeVisible();

  const projectId = new URL(page.url()).pathname.split("/")[2];
  await page.goto(`/p/${projectId}/deploy`);
  await expect(page.getByRole("heading", { name: "Pre-flight" })).toBeVisible();

  await page.goto("/home");
  await page.getByRole("link", { name: /Support Desk/ }).click();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await page.getByRole("button", { name: "Deploy" }).click();
  await expect(page.getByText("support-desk.vercel.app").first()).toBeVisible();
  await expect(page.getByText("support-desk-previous.vercel.app")).toBeVisible();

  await page.goto("/home");
  await page.getByRole("link", { name: /Lead Research Assistant/ }).click();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByRole("button", { name: "Approve plan" })).toBeEnabled();
});
