import { expect, test } from "@playwright/test";

test("prompt becomes a plan, agents, and saved files", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/try");
  await page.getByPlaceholder(/Describe your app/).fill("A receipt scanner for a small shop");
  await page.getByRole("button", { name: /Build/ }).click();
  await expect(page.getByRole("button", { name: "Approve plan" })).toBeEnabled({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Who it's for" })).toBeVisible();
  await page.getByRole("button", { name: "Approve plan" }).click();
  await expect(page.getByRole("button", { name: "Approve agents" })).toBeEnabled({ timeout: 20_000 });
  await page.getByRole("button", { name: "Approve agents" }).click();
  await page.getByRole("button", { name: "Build app" }).click();
  await expect(page.getByText("src/App.tsx")).toBeVisible({ timeout: 20_000 });
  await page.getByPlaceholder("Describe a change to the plan…").fill("Add a totals screen");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByRole("heading", { name: "Change plan" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Apply plan" })).toBeVisible();

  await page.getByRole("tab", { name: "Agents" }).click();
  await page.getByText("Manager", { exact: true }).first().click();
  await page.getByRole("tab", { name: "Instructions" }).click();
  await page.getByRole("dialog").getByRole("textbox").fill("Keep every receipt total in the ledger.");
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/agents/") && response.request().method() === "PUT" && response.ok()),
    page.getByRole("button", { name: "Save instructions" }).click(),
  ]);
  await page.reload();
  await page.getByRole("tab", { name: "Agents" }).click();
  await page.getByText(/Manager/).first().click();
  await page.getByRole("tab", { name: "Instructions" }).click();
  await expect(page.getByRole("dialog").getByRole("textbox")).toHaveValue("Keep every receipt total in the ledger.");

  await page.getByRole("tab", { name: "Test" }).click();
  await page.getByRole("button", { name: "Run test" }).click();
  await expect(page.getByText("Test passed").first()).toBeVisible();
});
