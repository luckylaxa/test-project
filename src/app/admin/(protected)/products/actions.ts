"use server";

import { revalidatePath } from "next/cache";
import { withAdmin, type ActionResult } from "@/lib/admin/actions";
import { tags } from "@/lib/cache-tags";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert, TablesUpdate } from "@/lib/types/database";

const productTags = (slug?: string) => [
  tags.products,
  tags.shades,
  tags.collections,
  ...(slug ? [tags.product(slug)] : []),
];

export async function saveProduct(
  id: string,
  patch: TablesUpdate<"products">,
  slug: string,
): Promise<ActionResult> {
  return withAdmin(productTags(slug), (supabase) =>
    supabase.from("products").update(patch).eq("id", id),
  );
}

export async function createProduct(values: TablesInsert<"products">): Promise<ActionResult & { id?: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").insert(values).select("id").single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/products");
  return { ok: true, id: data.id };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  return withAdmin(productTags(), (supabase) => supabase.from("products").delete().eq("id", id));
}

/**
 * Replaces a product's shades in one go.
 *
 * Saving the whole set is simpler for the editor to reason about than tracking
 * individual adds and removes, and it keeps sort order consistent.
 */
export async function saveShades(
  productId: string,
  productSlug: string,
  shades: {
    id?: string;
    name: string;
    hex: string;
    finish: TablesInsert<"shades">["finish"];
    default_intensity: number;
    is_visible: boolean;
  }[],
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const keep = shades.map((s) => s.id).filter(Boolean) as string[];

  // Remove shades the editor deleted.
  const removal =
    keep.length > 0
      ? await supabase.from("shades").delete().eq("product_id", productId).not("id", "in", `(${keep.join(",")})`)
      : await supabase.from("shades").delete().eq("product_id", productId);
  if (removal.error) return { ok: false, error: removal.error.message };

  for (const [index, shade] of shades.entries()) {
    const row = {
      product_id: productId,
      name: shade.name,
      hex: shade.hex,
      finish: shade.finish,
      default_intensity: shade.default_intensity,
      is_visible: shade.is_visible,
      sort_order: index + 1,
    };
    const { error } = shade.id
      ? await supabase.from("shades").update(row).eq("id", shade.id)
      : await supabase.from("shades").insert(row);
    if (error) return { ok: false, error: error.message };
  }

  return withAdmin(productTags(productSlug), async () => ({ error: null }));
}

export async function reorderProducts(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  for (const [index, id] of ids.entries()) {
    const { error } = await supabase.from("products").update({ sort_order: index + 1 }).eq("id", id);
    if (error) return { ok: false, error: error.message };
  }
  return withAdmin([tags.products], async () => ({ error: null }));
}

export async function saveRelated(
  productId: string,
  productSlug: string,
  relatedIds: string[],
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const cleared = await supabase.from("product_related").delete().eq("product_id", productId);
  if (cleared.error) return { ok: false, error: cleared.error.message };

  if (relatedIds.length > 0) {
    const { error } = await supabase.from("product_related").insert(
      relatedIds.map((related_product_id, index) => ({
        product_id: productId,
        related_product_id,
        sort_order: index + 1,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  return withAdmin(productTags(productSlug), async () => ({ error: null }));
}
