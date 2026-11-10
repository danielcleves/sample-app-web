import { capture, expect, test } from "../fixtures/test";

test.describe("Caja blanca — módulo ShoppingCart", () => {
  test("[EXTRA-WB-001] @regression addItem/removeItem cubren ambas ramas de la guarda", async ({
    page,
  }, testInfo) => {
    await page.goto("/inventory.html");

    const result = await page.evaluate(async () => {
      const { ShoppingCart } = await import("/src/utils/shopping-cart.js");

      ShoppingCart.resetCart();
      ShoppingCart.addItem(0); // rama: el ítem no estaba -> se agrega
      ShoppingCart.addItem(0); // rama: el ítem ya estaba -> no se duplica
      const afterAdd = ShoppingCart.getCartContents();

      ShoppingCart.removeItem(0); // rama: el ítem estaba -> se elimina
      const afterRemove = ShoppingCart.getCartContents();

      ShoppingCart.removeItem(99); // rama: el ítem no estaba -> no cambia
      const afterMissingRemove = ShoppingCart.getCartContents();

      ShoppingCart.resetCart();
      return { afterAdd, afterRemove, afterMissingRemove };
    });

    await testInfo.attach("shopping-cart-resultado", {
      body: JSON.stringify(result, null, 2),
      contentType: "application/json",
    });

    expect(result.afterAdd).toEqual([0]);
    expect(result.afterRemove).toEqual([]);
    expect(result.afterMissingRemove).toEqual([]);
  });
});
