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

/** Most of one item in one basket. The server enforces the same number. */
export const MAX_QUANTITY = 20;

/** Most distinct lines in one basket. */
export const MAX_LINES = 20;

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

/**
 * Digit grouping is a property of the currency's home, not of the site.
 * Rupees are grouped in lakhs — a shopper in India reads 1,50,000, and
 * 150,000 looks like a typo.
 */
const LOCALE_FOR: Record<string, string> = { INR: "en-IN", USD: "en-US", AED: "en-AE" };

export function formatMoney(minorUnits: number, currency: string, locale?: string) {
  try {
    return new Intl.NumberFormat(locale ?? LOCALE_FOR[currency.toUpperCase()] ?? "en-GB", {
      style: "currency",
      currency,
      // Whole numbers look cleaner on a luxury site; keep decimals only when real.
      minimumFractionDigits: minorUnits % 100 === 0 ? 0 : 2,
    }).format(minorUnits / 100);
  } catch {
    return `${(minorUnits / 100).toFixed(2)} ${currency}`;
  }
}
