import { expect, type Locator, type Page } from "@playwright/test";
import { slug, type ProductName } from "../support/products";

/**
 * Shared header chrome (cart link/badge) reused by every page object.
 */
export abstract class BasePage {
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  protected constructor(protected readonly page: Page) {
    this.cartLink = page.getByTestId("shopping-cart-link");
    this.cartBadge = page.getByTestId("shopping-cart-badge");
  }

  async openCart() {
    await this.cartLink.click();
    await expect(this.page).toHaveURL(/\/cart\.html$/);
  }

  async expectCartBadge(quantity: number) {
    if (quantity === 0) {
      await expect(this.cartBadge).toHaveCount(0);
      return;
    }

    await expect(this.cartBadge).toHaveText(String(quantity));
  }
}

/**
 * Products page: listing, sorting, add/remove from the catalog.
 */
export class InventoryPage extends BasePage {
  readonly sortSelect: Locator;
  readonly activeSort: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly list: Locator;

  constructor(page: Page) {
    super(page);
    this.sortSelect = page.getByTestId("product-sort-container");
    this.activeSort = page.getByTestId("active-option");
    this.itemNames = page.getByTestId("inventory-item-name");
    this.itemPrices = page.getByTestId("inventory-item-price");
    this.list = page.getByTestId("inventory-list");
  }

  async goto() {
    await this.page.goto("/inventory.html");
    await this.expectLoaded();
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("title")).toHaveText("Products");
    await expect(this.list).toBeVisible();
  }

  async sortBy(option: string, expectedLabel: string) {
    await this.sortSelect.selectOption(option);
    await expect(this.activeSort).toHaveText(expectedLabel);
  }

  async names(): Promise<string[]> {
    return this.itemNames.allTextContents();
  }

  async prices(): Promise<string[]> {
    return this.itemPrices.allTextContents();
  }

  async addToCart(product: ProductName) {
    const button = this.page.getByTestId(`add-to-cart-${slug(product)}`);
    await expect(button).toHaveText("Add to cart");
    await button.click();
    await expect(this.page.getByTestId(`remove-${slug(product)}`)).toBeVisible();
  }

  async removeFromCart(product: ProductName) {
    await this.page.getByTestId(`remove-${slug(product)}`).click();
    await expect(this.page.getByTestId(`add-to-cart-${slug(product)}`)).toBeVisible();
  }

  async openProduct(id: number) {
    await this.page.getByTestId(`item-${id}-title-link`).click();
    await expect(this.page).toHaveURL(/\/inventory-item\.html\?id=\d+$/);
    await expect(this.page.getByTestId("back-to-products")).toBeVisible();
  }
}
