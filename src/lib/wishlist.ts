"use server";

import { createClient } from "@/lib/supabase/server";

export type WishlistResult = { ok: true; saved: boolean } | { ok: false; needsSignIn: boolean };

/**
 * Saves or unsaves a product for the signed-in customer.
 *
 * `user_id` comes from the session, never the form, and RLS enforces the same
 * rule again at the database — a customer can only ever touch their own rows.
 */
export async function toggleWishlist(productId: string): Promise<WishlistResult> {
  if (typeof productId !== "string" || productId.length === 0) {
    return { ok: false, needsSignIn: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, needsSignIn: true };

  const { data: existing } = await supabase
    .from("wishlist")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);
    return error ? { ok: false, needsSignIn: false } : { ok: true, saved: false };
  }

  const { error } = await supabase
    .from("wishlist")
    .insert({ user_id: user.id, product_id: productId });
  return error ? { ok: false, needsSignIn: false } : { ok: true, saved: true };
}
