import type { ProductRow, ShadeRow } from "@/lib/content";

/**
 * One rule for "can this go in a basket right now".
 *
 * It was written out by hand in the card, the product page, the desktop try-on
 * panel and the phone try-on overlay — four copies of a condition that decides
 * whether money changes hands. Adding stock to it would have meant finding all
 * four, and missing one would leave a sold-out shade buyable in exactly one
 * place. `createCheckout` enforces the same thing server side; this is what the
 * interface shows.
 */
export function canSell({
  checkoutEnabled,
  product,
  shade,
}: {
  checkoutEnabled: boolean;
  product: Pick<ProductRow, "is_purchasable" | "price_amount" | "stock_status">;
  /** Omit for a product with no shades. */
  shade?: Pick<ShadeRow, "is_in_stock"> | null;
}): boolean {
  if (!checkoutEnabled) return false;
  if (!product.is_purchasable) return false;
  if ((product.price_amount ?? 0) <= 0) return false;
  if (product.stock_status === "out_of_stock") return false;
  if (shade && !shade.is_in_stock) return false;
  return true;
}

/**
 * Sold out as a customer means it: the product row says so, or it has shades
 * and every one of them has gone. A colour picker with nothing pickable is not
 * "in stock".
 */
export function isSoldOut(
  product: Pick<ProductRow, "stock_status">,
  visibleShades: Pick<ShadeRow, "is_in_stock">[],
): boolean {
  if (product.stock_status === "out_of_stock") return true;
  return visibleShades.length > 0 && visibleShades.every((s) => !s.is_in_stock);
}
