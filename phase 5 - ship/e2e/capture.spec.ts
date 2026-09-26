import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";

const shots = path.resolve(process.cwd(), "../docs/screenshots");
const enabled = Boolean(process.env.CAPTURE);

test.use({ video: "on", viewport: { width: 1440, height: 900 } });
test.skip(!enabled, "Set CAPTURE=1 to write screenshots and the walkthrough video.");

test("record the walkthrough and stage screenshots", async ({ page }) => {
  test.setTimeout(240_000);
  await mkdir(shots, { recursive: true });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
  await page.screenshot({ path: path.join(shots, "01-landing.png") });

  await page.goto("/try");
  await expect(page.getByRole("heading", { name: "What do you want to build?" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Lead Research Assistant/ })).toBeVisible();
  await page.screenshot({ path: path.join(shots, "02-home.png"), fullPage: true });

  await page.getByRole("link", { name: /Travel Planner/ }).click();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await page.getByRole("tab", { name: "Plan" }).click();
  await expect(page.getByRole("textbox", { name: "Who it's for" })).toHaveValue("Friends planning a trip together");
  await page.screenshot({ path: path.join(shots, "03-plan.png") });

  await page.getByRole("tab", { name: "Agents" }).click();
  await expect(page.getByText("Trip Manager")).toBeVisible();
  await page.screenshot({ path: path.join(shots, "04-agents.png") });

  await page.getByRole("tab", { name: "Preview" }).click();
  await expect(page.getByRole("contentinfo").getByText("Preview ready")).toBeVisible({ timeout: 150_000 });
  await page.screenshot({ path: path.join(shots, "05-preview.png") });

  const projectId = new URL(page.url()).pathname.split("/")[2];
  await page.goto(`/p/${projectId}/deploy`);
  await expect(page.getByRole("heading", { name: "Pre-flight" })).toBeVisible();
  await page.screenshot({ path: path.join(shots, "06-deploy.png") });

  await page.goto("/usage");
  await expect(page.getByRole("heading", { name: "Usage" })).toBeVisible();
  await page.screenshot({ path: path.join(shots, "07-usage.png") });

  const video = page.video();
  await video?.saveAs(path.resolve(process.cwd(), "../docs/walkthrough.webm"));
});
