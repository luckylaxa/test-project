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
    .select("id, name, slug, price_amount, is_purchasable, gallery, shades(id, name, hex, is_visible)")
    .eq("is_visible", true);

  const out: Record<string, CartLineView> = {};

  for (const product of data ?? []) {
    const image = gallery(product.gallery)[0]?.url ?? null;
    const available = Boolean(product.is_purchasable) && (product.price_amount ?? 0) > 0;
    const base = {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      unitAmount: product.price_amount ?? 0,
      image,
      available,
      quantity: 1,
    };

    // A product with no shades is still purchasable on its own.
    out[`${product.id}:`] = { ...base, shadeId: null, shadeName: null, shadeHex: null };

    for (const shade of product.shades ?? []) {
      if (!shade.is_visible) continue;
      out[`${product.id}:${shade.id}`] = {
        ...base,
        shadeId: shade.id,
        shadeName: shade.name,
        shadeHex: shade.hex,
      };
    }
  }

  return out;
}
