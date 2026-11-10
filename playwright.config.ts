import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for the Sauce Labs Sample App Web.
 *
 * Least-privilege principle: the UI uses the `data-test` attribute for its
 * test ids, so we tell Playwright about it once instead of scattering CSS
 * selectors through the specs.
 *
 * Authentication is NOT a functionality under test in this exam: it is only a
 * precondition, so it runs once in the `setup` project and the resulting
 * storage state (cookie + localStorage) is reused by the specs.
 */
export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    testIdAttribute: "data-test",
    locale: "en-US",
    timezoneId: "America/Bogota",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/standard-user.json",
      },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
    },
  ],

  webServer: {
    command: "npm start -- --no-open",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
