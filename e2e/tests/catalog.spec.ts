import { annotateDefect, capture, expect, test } from "../fixtures/test";
import { PRODUCTS, SORT_LABELS } from "../support/products";

test.describe("Funcionalidad 1 — Catálogo de productos", () => {
  test("[TC-CAT-001] @smoke ordena el catálogo por precio de menor a mayor", async ({
    page,
    inventory,
  }, testInfo) => {
    await inventory.goto();

    // Regla: 6 productos visibles antes de ordenar (partición válida del catálogo).
    await expect(inventory.itemNames).toHaveCount(6);

    await inventory.sortBy("lohi", SORT_LABELS.lohi);
    const prices = await inventory.prices();
    const numericPrices = prices.map((price) => Number(price.replace("$", "")));

    // Resultado esperado 1: la lista queda ordenada de forma ascendente.
    expect(numericPrices).toEqual([7.99, 9.99, 15.99, 15.99, 29.99, 49.99]);
    expect(numericPrices).toEqual([...numericPrices].sort((a, b) => a - b));

    // Resultado esperado 2: extremos correctos y nombre del producto más barato.
    await expect(inventory.itemNames.first()).toHaveText(PRODUCTS.onesie);
    await expect(inventory.itemNames.last()).toHaveText(PRODUCTS.fleeceJacket);
    await expect(inventory.itemPrices.first()).toHaveText("$7.99");
    await expect(inventory.itemPrices.last()).toHaveText("$49.99");

    await capture(page, testInfo, "TC-CAT-001-orden-precio-ascendente");
  });

  test("[TC-CAT-002] @regression las cuatro opciones de ordenamiento producen el orden esperado", async ({
    page,
    inventory,
  }, testInfo) => {
    // Tabla de decisión: una regla por opción del selector (4 reglas, 1 condición).
    const rules = [
      {
        option: "az",
        first: PRODUCTS.backpack,
        last: PRODUCTS.redTShirt,
      },
      {
        option: "za",
        first: PRODUCTS.redTShirt,
        last: PRODUCTS.backpack,
      },
      {
        option: "lohi",
        first: PRODUCTS.onesie,
        last: PRODUCTS.fleeceJacket,
      },
      {
        option: "hilo",
        first: PRODUCTS.fleeceJacket,
        last: PRODUCTS.onesie,
      },
    ] as const;

    await inventory.goto();

    for (const rule of rules) {
      await test.step(`Regla ${rule.option.toUpperCase()}: ${SORT_LABELS[rule.option]}`, async () => {
        await inventory.sortBy(rule.option, SORT_LABELS[rule.option]);
        await expect(inventory.itemNames).toHaveCount(6);
        await expect(inventory.itemNames.first()).toHaveText(rule.first);
        await expect(inventory.itemNames.last()).toHaveText(rule.last);
      });
    }

    await capture(page, testInfo, "TC-CAT-002-cuatro-ordenamientos");
  });

  test.describe("usuario problem_user", () => {
    test.use({ storageState: "e2e/.auth/problem-user.json" });

    test("[TC-CAT-003] @known-defect el ordenamiento debe aplicarse también a problem_user", async ({
      page,
      inventory,
    }, testInfo) => {
      annotateDefect(
        testInfo,
        "BUG-01",
        "problem_user: la rama temprana de sortByOption ignora el cambio de ordenamiento",
      );

      await inventory.goto();
      await inventory.sortSelect.selectOption("lohi");
      // Punto de sincronización: el catálogo sigue mostrando sus 6 productos.
      await expect(inventory.itemNames).toHaveCount(6);

      // Evidencia del comportamiento observado antes de asertar la regla.
      await capture(page, testInfo, "TC-CAT-003-problem-user-ordenamiento");

      // Resultado esperado: la opción se aplica y la lista queda ordenada por precio.
      await expect(inventory.activeSort).toHaveText(SORT_LABELS.lohi);
      await expect(inventory.itemNames.first()).toHaveText(PRODUCTS.onesie);
      await expect(inventory.itemPrices.first()).toHaveText("$7.99");
    });
  });
});
