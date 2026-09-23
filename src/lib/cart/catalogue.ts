import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { tags } from "@/lib/cache-tags";
import { gallery } from "@/lib/section-content";
import type { CartLineView } from "./types";

/**
 * A snapshot of everything purchasable, keyed by "productId:shadeId".
 *
 * The basket stores only identifiers, so the drawer needs this to show names
 * and prices. It is a display aid — the real prices are re-read again on the
 * server at checkout, so a stale snapshot can never cause a wrong charge.
 */
export async function getCartCatalogue(): Promise<Record<string, CartLineView>> {
  "use cache";
  cacheTag(tags.products, tags.shades);
  cacheLife("hours");

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, slug, price_amount, is_purchasable, stock_status, gallery, shades(id, name, hex, is_visible, is_in_stock)")
    .eq("is_visible", true);

  const out: Record<string, CartLineView> = {};

  for (const product of data ?? []) {
    const image = gallery(product.gallery)[0]?.url ?? null;
    const visibleShades = (product.shades ?? []).filter((s) => s.is_visible);
    const sellable =
      Boolean(product.is_purchasable) &&
      (product.price_amount ?? 0) > 0 &&
      product.stock_status !== "out_of_stock";
    const base = {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      unitAmount: product.price_amount ?? 0,
      image,
      available: sellable,
      quantity: 1,
    };

    // A product with no shades is purchasable on its own. One WITH shades is
    // not: a shadeless line for it means the shade was never chosen, so it
    // resolves as unavailable rather than quietly checking out. `createCheckout`
    // refuses the same case — this only makes the basket say so.
    out[`${product.id}:`] = {
      ...base,
      available: sellable && visibleShades.length === 0,
      shadeId: null,
      shadeName: null,
      shadeHex: null,
    };

    for (const shade of visibleShades) {
      out[`${product.id}:${shade.id}`] = {
        ...base,
        available: sellable && shade.is_in_stock,
        shadeId: shade.id,
        shadeName: shade.name,
        shadeHex: shade.hex,
      };
    }
  }

  return out;
}
