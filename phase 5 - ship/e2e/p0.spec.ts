import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { auditDesign } from "../../common/scripts/design-audit";

test("signed-out visitors are sent to login", async ({ page }) => {
  await page.goto("/home");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/p/not-a-project");
  await expect(page).toHaveURL(/\/login/);
});

test("login and a guest session through to a project", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in to Architect" })).toBeVisible();
  const loginAudit = await auditDesign(page);
  expect(loginAudit.bodyFont.toLowerCase()).toContain("inter");
  expect(loginAudit.accentButtons).toBe(1);
  expect(loginAudit.lavender).toBe(0);
  expect(loginAudit.unlabelledIconButtons).toBe(0);

  await page.getByRole("link", { name: "Try without an account" }).click();
  await expect(page.getByRole("heading", { name: "What do you want to build?" })).toBeVisible();
  await expect(page.getByText("Travel Planner")).toBeVisible();
  await expect(page.getByText("Sign up to keep your work.")).toBeVisible();

  const homeAudit = await auditDesign(page);
  expect(homeAudit.accentButtons).toBe(1);
  expect(homeAudit.lavender).toBe(0);
  expect(homeAudit.unlabelledIconButtons).toBe(0);

  const homeAxe = await new AxeBuilder({ page }).analyze();
  expect(homeAxe.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);

  await page.getByRole("button", { name: "Switch to Developer mode" }).click();
  await expect(page.getByRole("button", { name: "Switch to Simple mode" })).toBeVisible();

  await page.getByRole("link", { name: /Travel Planner/ }).click();
  await expect(page.getByRole("tab", { name: "Code" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Git" })).toBeVisible();
  await page.getByRole("tab", { name: "Agents" }).click();
  await expect(page.getByText("Trip Manager")).toBeVisible();

  await page.goto("/home");
  const prompt = page.getByPlaceholder(/Describe your app/);
  const build = page.getByRole("button", { name: /Build/ });
  await expect(async () => {
    await prompt.fill("x");
    await prompt.fill("A receipt scanner for a small shop");
    await expect(build).toBeEnabled({ timeout: 1_000 });
  }).toPass({ timeout: 30_000 });
  await build.click();
  await expect(page.getByText("Receipt Scanner For A Small Shop")).toBeVisible();
  await expect(page.getByText("A receipt scanner for a small shop")).toBeVisible();
});
