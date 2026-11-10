import { expect, type Locator, type Page } from "@playwright/test";
import { slug, type ProductName } from "../support/products";
import { BasePage } from "./inventory.page";

/**
 * Shopping cart page ("/cart.html").
 */
export class CartPage extends BasePage {
  readonly items: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.getByTestId("inventory-item");
    this.checkoutButton = page.getByTestId("checkout");
    this.continueShoppingButton = page.getByTestId("continue-shopping");
  }

  async goto() {
    await this.page.goto("/cart.html");
    await this.expectLoaded();
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("title")).toHaveText("Your Cart");
    await expect(this.page.getByTestId("cart-contents-container")).toBeVisible();
  }

  async names(): Promise<string[]> {
    return this.page.getByTestId("inventory-item-name").allTextContents();
  }

  async remove(product: ProductName) {
    await this.page.getByTestId(`remove-${slug(product)}`).click();
  }

  async checkout() {
    await this.checkoutButton.click();
    await expect(this.page).toHaveURL(/\/checkout-step-one\.html$/);
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
    await expect(this.page).toHaveURL(/\/inventory\.html$/);
  }
}
