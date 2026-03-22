import { defineConfig, devices } from "@playwright/test";
import { loadTestEnv } from "./e2e/support/env";

loadTestEnv();

const port = Number(process.env.E2E_PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
const databaseURL = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html"], ["list"]] : [["list"]],
  timeout: 45_000,
  use: {
    acceptDownloads: true,
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: `npx next dev --webpack --hostname 127.0.0.1 --port ${port}`,
    env: {
      ...process.env,
      DATABASE_URL: databaseURL,
    },
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120_000,
    url: baseURL,
  },
});
