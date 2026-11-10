/**
 * Catalog fixture of the Sample App Web (src/utils/InventoryData.js).
 *
 * Keeping the data in one place makes the expected results of the specs
 * explicit and avoids magic strings spread across the suite.
 */
export const PRODUCTS = {
  bikeLight: "Sauce Labs Bike Light",
  boltTShirt: "Sauce Labs Bolt T-Shirt",
  onesie: "Sauce Labs Onesie",
  redTShirt: "Test.allTheThings() T-Shirt (Red)",
  backpack: "Sauce Labs Backpack",
  fleeceJacket: "Sauce Labs Fleece Jacket",
} as const;

export type ProductName = (typeof PRODUCTS)[keyof typeof PRODUCTS];

export interface CatalogProduct {
  name: ProductName;
  price: number;
}

/** Catalog in its natural (insertion) order: ids 0..5. */
export const CATALOG: CatalogProduct[] = [
  { name: PRODUCTS.bikeLight, price: 9.99 },
  { name: PRODUCTS.boltTShirt, price: 15.99 },
  { name: PRODUCTS.onesie, price: 7.99 },
  { name: PRODUCTS.redTShirt, price: 15.99 },
  { name: PRODUCTS.backpack, price: 29.99 },
  { name: PRODUCTS.fleeceJacket, price: 49.99 },
];

export const PRICE_BY_NAME = new Map(CATALOG.map((p) => [p.name, p.price]));

export const SORT_LABELS = {
  az: "Name (A to Z)",
  za: "Name (Z to A)",
  lohi: "Price (low to high)",
  hilo: "Price (high to low)",
} as const;

export type SortOption = keyof typeof SORT_LABELS;

/** Test id fragment used by the app: lowercase, spaces -> dashes. */
export function slug(name: string): string {
  return name.replace(/\s+/g, "-").toLowerCase();
}

/** Order totals as rendered by CheckOutStepTwo (tax = 8%, two decimals). */
export function expectedTotals(names: ProductName[]) {
  const total = names.reduce((sum, name) => sum + (PRICE_BY_NAME.get(name) ?? 0), 0);
  const tax = Number((total * 0.08).toFixed(2));
  const grandTotal = Number((total + tax).toFixed(2));

  return {
    total: total.toFixed(2),
    tax: tax.toFixed(2),
    grandTotal: grandTotal.toFixed(2),
  };
}
