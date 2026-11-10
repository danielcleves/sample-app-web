import { annotateDefect, capture, expect, test } from "../fixtures/test";
import { PRODUCTS, expectedTotals } from "../support/products";

test.describe("Funcionalidad 3 — Checkout", () => {
  test("[TC-CHK-001] @smoke completa un pedido con datos de envío válidos", async ({
    page,
    inventory,
    cart,
    checkout,
  }, testInfo) => {
    await inventory.goto();
    await inventory.addToCart(PRODUCTS.backpack);
    await inventory.addToCart(PRODUCTS.bikeLight);
    await inventory.openCart();
    await cart.checkout();
    await checkout.expectStepOne();

    await checkout.fillShippingInfo({
      firstName: "Daniel",
      lastName: "Cleves",
      postalCode: "760001",
    });
    await checkout.continue();
    await checkout.expectStepTwo();

    // Resultado esperado 1: totales con impuesto del 8 %.
    const totals = expectedTotals([PRODUCTS.backpack, PRODUCTS.bikeLight]);
    await expect(checkout.subtotal).toHaveText(`Item total: $${totals.total}`);
    await expect(checkout.tax).toHaveText(`Tax: $${totals.tax}`);
    await expect(checkout.total).toHaveText(`Total: $${totals.grandTotal}`);

    await capture(page, testInfo, "TC-CHK-001-resumen-totales");

    await checkout.finish();
    await checkout.expectComplete();

    // Resultado esperado 2: el carrito queda vacío tras confirmar.
    await expect(page.getByTestId("shopping-cart-badge")).toHaveCount(0);

    await capture(page, testInfo, "TC-CHK-001-confirmacion-pedido");
  });

  test("[TC-CHK-002] @regression tabla de decisión de campos obligatorios", async ({
    page,
    inventory,
    cart,
    checkout,
  }, testInfo) => {
    // Tabla de decisión (3 condiciones -> 8 reglas, colapsadas a 4 resultados):
    // C1 firstName, C2 lastName, C3 postalCode. Se informa el primer faltante
    // en el orden C1 -> C2 -> C3.
    await inventory.goto();
    await inventory.addToCart(PRODUCTS.onesie);
    await inventory.openCart();
    await cart.checkout();
    await checkout.expectStepOne();

    await test.step("Regla R1: sin nombre, sin apellido y sin código postal", async () => {
      await checkout.continue();
      await checkout.expectError("Error: First Name is required");
    });

    await test.step("Regla R5: nombre presente, sin apellido ni código postal", async () => {
      await checkout.firstName.fill("Daniel");
      await checkout.continue();
      await checkout.expectError("Error: Last Name is required");
    });

    await test.step("Regla R7: nombre y apellido presentes, sin código postal", async () => {
      await checkout.lastName.fill("Cleves");
      await checkout.continue();
      await checkout.expectError("Error: Postal Code is required");
    });

    await test.step("Regla R8: los tres campos presentes -> resumen del pedido", async () => {
      await checkout.postalCode.fill("760001");
      await checkout.continue();
      await checkout.expectStepTwo();
    });

    await capture(page, testInfo, "TC-CHK-002-tabla-decision-campos");
  });

  test("[TC-CHK-003] @known-defect los campos obligatorios deben rechazar solo espacios", async ({
    page,
    inventory,
    cart,
    checkout,
  }, testInfo) => {
    annotateDefect(
      testInfo,
      "BUG-03",
      "los campos obligatorios aceptan cadenas de solo espacios (no hay trim)",
    );

    await inventory.goto();
    await inventory.addToCart(PRODUCTS.onesie);
    await inventory.openCart();
    await cart.checkout();
    await checkout.expectStepOne();

    // Partición inválida: cadena no vacía compuesta solo por espacios.
    await checkout.fillShippingInfo({
      firstName: " ",
      lastName: " ",
      postalCode: " ",
    });
    await checkout.continue();

    // Evidencia del defecto: se llega al resumen con datos en blanco.
    await checkout.expectStepTwo();
    await capture(page, testInfo, "TC-CHK-003-espacios-aceptados");

    // Resultado esperado: nunca debe avanzar con valores sin contenido real.
    await expect(page).not.toHaveURL(/\/checkout-step-two\.html$/);
  });

  test("[TC-CHK-004] @known-defect caja blanca: la rama doublePrices duplica los totales", async ({
    page,
  }, testInfo) => {
    annotateDefect(
      testInfo,
      "BUG-04",
      "calculateOrderTotals duplica cada precio cuando doublePrices=true (problem_user)",
    );

    await page.goto("/inventory.html");

    // Caja blanca: se invoca el módulo de cálculo directamente para aislar la
    // rama `doublePrices`, que por BUG-05 es inalcanzable desde la interfaz.
    const result = await page.evaluate(async () => {
      const { calculateOrderTotals } = await import(
        "/src/utils/orderCalculations.js"
      );
      return {
        normal: calculateOrderTotals([0, 1]),
        doubled: calculateOrderTotals([0, 1], { doublePrices: true }),
      };
    });

    await testInfo.attach("calculateOrderTotals-resultado", {
      body: JSON.stringify(result, null, 2),
      contentType: "application/json",
    });

    // Resultado esperado: el total no depende del perfil del usuario.
    expect(result.normal).toEqual({ orderTotal: 25.98, orderTax: "2.08", orderGrandTotal: "28.06" });
    expect(result.doubled).toEqual(result.normal);
  });
});
