import { test as base, expect, type Page, type TestInfo } from "@playwright/test";
import { CartPage } from "../pages/cart.page";
import { CheckoutPage } from "../pages/checkout.page";
import { InventoryPage } from "../pages/inventory.page";

interface Pages {
  inventory: InventoryPage;
  cart: CartPage;
  checkout: CheckoutPage;
}

/**
 * Page-object fixtures: specs never build locators by hand, they drive the UI
 * through the same vocabulary a user would use.
 */
export const test = base.extend<Pages>({
  inventory: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cart: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkout: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

export { expect };

/**
 * Persist a screenshot as execution evidence: it is attached to the HTML
 * report and also written to `test-results/evidence/` so it can be collected
 * for the written report.
 */
export async function capture(page: Page, testInfo: TestInfo, name: string) {
  const png = await page.screenshot({ fullPage: true });
  await testInfo.attach(name, { body: png, contentType: "image/png" });

  const { mkdir, writeFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const dir = join("test-results", "evidence");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${name}.png`), png);
}

/** Tag a test with the defect it exposes, so the report keeps traceability. */
export function annotateDefect(testInfo: TestInfo, id: string, summary: string) {
  testInfo.annotations.push({ type: "defect", description: `${id}: ${summary}` });
}
