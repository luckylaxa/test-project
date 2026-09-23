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

/**
 * Every product the signed-in customer has saved.
 *
 * A grid of cards each needs to know whether it is saved, and doing that with
 * one server read per card would cost the static page its cache. This is read
 * once from the browser after hydration instead, so the grids stay prerendered
 * and the hearts fill in a moment later.
 *
 * Signed out is `[]`, not an error: nothing is saved, which is the truth.
 */
export async function listSavedIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase.from("wishlist").select("product_id").eq("user_id", user.id);
  return (data ?? []).map((row) => row.product_id);
}
