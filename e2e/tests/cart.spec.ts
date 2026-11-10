import { annotateDefect, capture, expect, test } from "../fixtures/test";
import { CATALOG, PRODUCTS, expectedTotals } from "../support/products";

test.describe("Funcionalidad 2 — Carrito de compras", () => {
  test("[TC-CAR-001] @smoke agrega dos productos y actualiza contador y carrito", async ({
    page,
    inventory,
    cart,
  }, testInfo) => {
    await inventory.goto();
    await inventory.expectCartBadge(0);

    await inventory.addToCart(PRODUCTS.backpack);
    await inventory.addToCart(PRODUCTS.bikeLight);

    // Resultado esperado 1: contador = 2.
    await inventory.expectCartBadge(2);

    await inventory.openCart();
    await cart.expectLoaded();

    // Resultado esperado 2: ambos productos listados con su precio.
    await expect(cart.items).toHaveCount(2);
    expect(await cart.names()).toEqual([PRODUCTS.backpack, PRODUCTS.bikeLight]);
    await expect(page.getByTestId("inventory-item-price").first()).toHaveText("$29.99");
    await expect(page.getByTestId("inventory-item-price").last()).toHaveText("$9.99");

    await capture(page, testInfo, "TC-CAR-001-dos-productos-en-carrito");
  });

  test("[TC-CAR-002] @regression ciclo de estados del carrito: vacío, 1, 2, 1 y vacío", async ({
    page,
    inventory,
    cart,
  }, testInfo) => {
    // Modelo de estados: EMPTY --add--> ONE --add--> TWO --remove--> ONE --remove--> EMPTY
    await inventory.goto();
    await inventory.expectCartBadge(0);

    await test.step("EMPTY -> ONE", async () => {
      await inventory.addToCart(PRODUCTS.backpack);
      await inventory.expectCartBadge(1);
    });

    await test.step("ONE -> TWO", async () => {
      await inventory.addToCart(PRODUCTS.bikeLight);
      await inventory.expectCartBadge(2);
    });

    await test.step("TWO -> ONE (elimina un producto)", async () => {
      await inventory.openCart();
      await cart.expectLoaded();
      await expect(cart.items).toHaveCount(2);

      await cart.remove(PRODUCTS.backpack);
      await expect(cart.items).toHaveCount(1);
      await expect(page.getByTestId("inventory-item-name")).toHaveText([PRODUCTS.bikeLight]);
      await cart.expectCartBadge(1);
    });

    await test.step("ONE -> EMPTY", async () => {
      await cart.remove(PRODUCTS.bikeLight);
      await expect(cart.items).toHaveCount(0);
      await cart.expectCartBadge(0);
    });

    await test.step("EMPTY persiste al navegar y recargar", async () => {
      await cart.continueShopping();
      await inventory.expectCartBadge(0);
      await inventory.openCart();
      await expect(cart.items).toHaveCount(0);

      await page.reload();
      await cart.expectLoaded();
      await expect(cart.items).toHaveCount(0);
    });

    await capture(page, testInfo, "TC-CAR-002-ciclo-estados-carrito");
  });

  test.describe("TC-CAR-003 — Análisis de valores límite (ítems del pedido: 1..6)", () => {
    test("[TC-CAR-003a] @regression Min = 1 ítem: el pedido se puede procesar", async ({
      page,
      inventory,
      cart,
      checkout,
    }, testInfo) => {
      await inventory.goto();
      await inventory.addToCart(PRODUCTS.onesie);
      await inventory.expectCartBadge(1);

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

      const totals = expectedTotals([PRODUCTS.onesie]);
      await expect(checkout.subtotal).toHaveText(`Item total: $${totals.total}`);
      await expect(checkout.tax).toHaveText(`Tax: $${totals.tax}`);
      await expect(checkout.total).toHaveText(`Total: $${totals.grandTotal}`);

      await capture(page, testInfo, "TC-CAR-003a-bva-minimo-un-item");
    });

    test("[TC-CAR-003b] @regression Max = 6 ítems: el pedido se puede procesar", async ({
      page,
      inventory,
      cart,
      checkout,
    }, testInfo) => {
      await inventory.goto();
      for (const product of CATALOG) {
        await inventory.addToCart(product.name);
      }
      await inventory.expectCartBadge(6);

      await inventory.openCart();
      await expect(cart.items).toHaveCount(6);
      await cart.checkout();
      await checkout.expectStepOne();
      await checkout.fillShippingInfo({
        firstName: "Daniel",
        lastName: "Cleves",
        postalCode: "760001",
      });
      await checkout.continue();
      await checkout.expectStepTwo();

      const totals = expectedTotals(CATALOG.map((product) => product.name));
      await expect(checkout.subtotal).toHaveText(`Item total: $${totals.total}`);
      await expect(checkout.tax).toHaveText(`Tax: $${totals.tax}`);
      await expect(checkout.total).toHaveText(`Total: $${totals.grandTotal}`);

      await capture(page, testInfo, "TC-CAR-003b-bva-maximo-seis-items");
    });

    test("[TC-CAR-003c] @known-defect Min-1 = 0 ítems: el checkout debe bloquearse", async ({
      page,
      cart,
      checkout,
    }, testInfo) => {
      annotateDefect(
        testInfo,
        "BUG-02",
        "el carrito vacío permite iniciar y completar un pedido de $0",
      );

      await cart.goto();
      await expect(cart.items).toHaveCount(0);

      // Camino observado: el botón sigue habilitado y el flujo llega al resumen.
      await cart.checkout();
      await checkout.expectStepOne();
      await checkout.fillShippingInfo({
        firstName: "Daniel",
        lastName: "Cleves",
        postalCode: "760001",
      });
      await checkout.continue();
      await checkout.expectStepTwo();

      // Evidencia del defecto: resumen de un pedido sin ítems.
      await expect(checkout.total).toHaveText("Total: $0.00");
      await capture(page, testInfo, "TC-CAR-003c-carrito-vacio-pedido-cero");

      // Resultado esperado: con 0 ítems nunca se debe alcanzar el resumen.
      await expect(page).not.toHaveURL(/\/checkout-step-two\.html$/);
    });
  });
});
