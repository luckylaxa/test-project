/**
 * A line in the basket.
 *
 * Only identifiers and quantity are stored. Prices and names are re-read from
 * the database at checkout — anything the browser sends about money is treated
 * as a suggestion, never as fact.
 */
export type CartLine = {
  productId: string;
  shadeId: string | null;
  quantity: number;
};

export type CartLineView = CartLine & {
  productName: string;
  productSlug: string;
  shadeName: string | null;
  shadeHex: string | null;
  unitAmount: number;
  image: string | null;
  available: boolean;
};

export const CART_STORAGE_KEY = "velmora.cart.v1";

/** Same item means same product AND same shade. */
export function sameLine(a: CartLine, b: CartLine) {
  return a.productId === b.productId && a.shadeId === b.shadeId;
}

export function formatMoney(minorUnits: number, currency: string, locale = "en-GB") {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      // Whole numbers look cleaner on a luxury site; keep decimals only when real.
      minimumFractionDigits: minorUnits % 100 === 0 ? 0 : 2,
    }).format(minorUnits / 100);
  } catch {
    return `${(minorUnits / 100).toFixed(2)} ${currency}`;
  }
}
