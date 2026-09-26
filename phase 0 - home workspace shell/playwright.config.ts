import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    ...devices["Desktop Chrome"],
    channel: "chrome",
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "pnpm dev --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
