import { expect, test as setup, type Browser } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { credentialsFor, type UserKey } from "../support/users";

/**
 * Authentication is a precondition, not a functionality under test.
 * We log in once per role through the UI and persist the storage state so the
 * specs start already authenticated, without repeating the login flow.
 */
const AUTH_DIR = "e2e/.auth";
const BASE_URL = "http://localhost:3000";

async function saveSession(browser: Browser, user: UserKey, fileName: string) {
  const { username, password } = credentialsFor(user);
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  await page.goto("/");
  await page.getByTestId("username").fill(username);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("login-button").click();

  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect(page.getByTestId("inventory-list")).toBeVisible();

  await context.storageState({ path: `${AUTH_DIR}/${fileName}` });
  await context.close();
}

setup.beforeAll(async () => {
  await mkdir(AUTH_DIR, { recursive: true });
});

setup("authenticate standard_user", async ({ browser }) => {
  await saveSession(browser, "standard", "standard-user.json");
});

setup("authenticate problem_user", async ({ browser }) => {
  await saveSession(browser, "problem", "problem-user.json");
});
