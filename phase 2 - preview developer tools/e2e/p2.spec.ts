import { expect, test } from "@playwright/test";

test("preview, self-heal, and restore", async ({ page }) => {
  test.setTimeout(200_000);
  const login = await page.goto("/login");
  expect(login?.headers()["cross-origin-embedder-policy"]).toBeFalsy();

  await page.getByRole("link", { name: "Try without an account" }).click();
  await expect(page.getByRole("heading", { name: "What do you want to build?" })).toBeVisible();
  const prompt = page.getByPlaceholder(/Describe your app/);
  const build = page.getByRole("button", { name: /Build/ });
  // A fill before Home hydrates leaves the text in the field and Build disabled. Change the value on each try.
  await expect(async () => {
    await prompt.fill("x");
    await prompt.fill("A receipt scanner for a small shop");
    await expect(build).toBeEnabled({ timeout: 1_000 });
  }).toPass({ timeout: 30_000 });
  await build.click();
  await expect(page.getByRole("button", { name: "Approve plan" })).toBeEnabled({ timeout: 20_000 });
  await page.getByRole("button", { name: "Approve plan" }).click();
  const approveAgents = page.getByRole("button", { name: "Approve agents" });
  await expect(approveAgents).toBeEnabled({ timeout: 20_000 });
  await approveAgents.click({ timeout: 5_000 }).catch(() => undefined);
  await expect(page.getByRole("button", { name: "Build app" })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Build app" }).click();
  await expect(page.getByText("src/App.tsx").first()).toBeVisible({ timeout: 20_000 });

  const isolated = await page.evaluate(() => window.crossOriginIsolated);
  expect(page.url()).toContain("/p/");
  const project = await page.request.get(page.url());
  expect(project.headers()["cross-origin-embedder-policy"]).toBe("require-corp");
  expect(project.headers()["cross-origin-opener-policy"]).toBe("same-origin");
  expect(isolated).toBe(true);

  await page.getByRole("tab", { name: "Preview" }).click();
  await expect(page.getByText(/Starting preview|Installing packages|Preview ready|Fallback preview/).first()).toBeVisible();
  const settled = page.locator("span").filter({ hasText: /Preview ready|Fallback preview|Preview error/ }).first();
  await expect(settled).toBeVisible({ timeout: 150_000 });
  const label = (await settled.innerText()).trim();
  console.log("PREVIEW_STATUS", label);
  expect(label).toMatch(/Preview ready|Fallback preview/);

  await page.evaluate(() => {
    window.postMessage({ type: "architect:pick", src: "src/components/Header.tsx" }, "*");
  });
  await expect(page.getByPlaceholder("Describe a change to build…")).toHaveValue("In `src/components/Header.tsx`: ");

  await page.evaluate(() => {
    window.postMessage({ type: "architect:error", kind: "build", message: "forced-unfixable", file: "src/App.tsx" }, "*");
  });
  await expect(page.getByRole("heading", { name: "Couldn't fix automatically" })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Show details" }).click();
  await expect(page.getByText("forced-unfixable")).toBeVisible();

  await page.getByRole("link", { name: /History/ }).click();
  await expect(page.getByRole("heading", { name: "Version history" })).toBeVisible();
  await page.getByRole("button", { name: /v1/ }).click();
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await page.getByRole("button", { name: "Restore version" }).click();
  await expect(page.getByText(/Restored/)).toBeVisible();
});
