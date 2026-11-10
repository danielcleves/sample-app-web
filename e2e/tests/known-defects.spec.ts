import { annotateDefect, capture, expect, test } from "../fixtures/test";
import { PRODUCTS } from "../support/products";

/**
 * Hallazgos adicionales de la sesión exploratoria, fuera de los 10 casos del
 * examen. Se automatizan para que queden trazados al defecto correspondiente.
 */
test.describe("usuario problem_user — hallazgos adicionales", () => {
  test.use({ storageState: "e2e/.auth/problem-user.json" });

  test("[EXTRA-BUG-05] @known-defect el campo Last Name escribe sobre First Name", async ({
    page,
    inventory,
    cart,
    checkout,
  }, testInfo) => {
    annotateDefect(
      testInfo,
      "BUG-05",
      "problem_user: handleLastNameChange sobrescribe firstName y deja lastName vacío",
    );

    await inventory.goto();
    await inventory.addToCart(PRODUCTS.onesie);
    await inventory.openCart();
    await cart.checkout();
    await checkout.expectStepOne();

    await checkout.lastName.fill("Cleves");
    await checkout.firstName.fill("Daniel");
    await checkout.postalCode.fill("760001");

    await capture(page, testInfo, "EXTRA-BUG-05-lastname-sobrescribe-firstname");

    // Resultado esperado: el apellido se conserva en su propio campo.
    await expect(checkout.lastName).toHaveValue("Cleves");

    await checkout.continue();
    await expect(checkout.errorMessage).toHaveText("Error: Last Name is required");
  });

  test("[EXTRA-BUG-06] @known-defect no se pueden agregar productos con id impar", async ({
    page,
    inventory,
  }, testInfo) => {
    annotateDefect(
      testInfo,
      "BUG-06",
      "problem_user: addToCart retorna sin agregar cuando el id del producto es impar",
    );

    await inventory.goto();
    await expect(inventory.cartBadge).toHaveCount(0);

    // Sauce Labs Bolt T-Shirt tiene id 1 (impar).
    await page.getByTestId("add-to-cart-sauce-labs-bolt-t-shirt").click();
    await expect(inventory.itemNames).toHaveCount(6);

    await capture(page, testInfo, "EXTRA-BUG-06-producto-impar");

    // Resultado esperado: el producto queda en el carrito y el contador lo refleja.
    await expect(inventory.cartBadge).toHaveText("1");
  });
});
