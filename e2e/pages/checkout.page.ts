import { expect, type Locator, type Page } from "@playwright/test";

export interface ShippingInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

/**
 * Checkout funnel: "Your Information" -> "Overview" -> "Complete!".
 */
export class CheckoutPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;
  readonly subtotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly finishButton: Locator;
  readonly completeHeader: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.getByTestId("firstName");
    this.lastName = page.getByTestId("lastName");
    this.postalCode = page.getByTestId("postalCode");
    this.continueButton = page.getByTestId("continue");
    this.cancelButton = page.getByTestId("cancel");
    this.errorMessage = page.getByTestId("error");
    this.subtotal = page.getByTestId("subtotal-label");
    this.tax = page.getByTestId("tax-label");
    this.total = page.getByTestId("total-label");
    this.finishButton = page.getByTestId("finish");
    this.completeHeader = page.getByTestId("complete-header");
  }

  async expectStepOne() {
    await expect(this.page.getByTestId("title")).toHaveText("Checkout: Your Information");
    await expect(this.firstName).toBeVisible();
  }

  async fillShippingInfo({ firstName, lastName, postalCode }: ShippingInfo) {
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.postalCode.fill(postalCode);
  }

  async continue() {
    await this.continueButton.click();
  }

  async expectStepTwo() {
    await expect(this.page.getByTestId("title")).toHaveText("Checkout: Overview");
    await expect(this.page.getByTestId("checkout-summary-container")).toBeVisible();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toHaveText(message);
  }

  async totals() {
    return {
      subtotal: await this.subtotal.textContent(),
      tax: await this.tax.textContent(),
      total: await this.total.textContent(),
    };
  }

  async finish() {
    await this.finishButton.click();
    await expect(this.page).toHaveURL(/\/checkout-complete\.html$/);
  }

  async expectComplete() {
    await expect(this.completeHeader).toHaveText("Thank you for your order!");
  }
}
