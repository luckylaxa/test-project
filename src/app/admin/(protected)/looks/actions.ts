"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { tags } from "@/lib/cache-tags";
import type { ActionResult } from "@/lib/admin/actions";

export type LookInput = {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  is_visible: boolean;
  items: { shade_id: string; intensity: number | null }[];
};

/** Saves every look and its shade list in one pass. */
export async function saveLooks(looks: LookInput[]): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const keep = looks.map((l) => l.id).filter(Boolean) as string[];
  const removal =
    keep.length > 0
      ? await supabase.from("looks").delete().not("id", "in", `(${keep.join(",")})`)
      : await supabase.from("looks").delete().not("id", "is", null);
  if (removal.error) return { ok: false, error: removal.error.message };

  for (const [index, look] of looks.entries()) {
    const row = {
      name: look.name,
      slug: look.slug,
      description: look.description,
      cover_image_url: look.cover_image_url,
      cover_image_alt: look.cover_image_alt,
      is_visible: look.is_visible,
      sort_order: index + 1,
    };

    let lookId = look.id;
    if (lookId) {
      const { error } = await supabase.from("looks").update(row).eq("id", lookId);
      if (error) return { ok: false, error: error.message };
    } else {
      const { data, error } = await supabase.from("looks").insert(row).select("id").single();
      if (error) return { ok: false, error: error.message };
      lookId = data.id;
    }

    // Shades in a look are always replaced wholesale — the set is small and
    // the order matters.
    const cleared = await supabase.from("look_items").delete().eq("look_id", lookId);
    if (cleared.error) return { ok: false, error: cleared.error.message };

    if (look.items.length > 0) {
      const { error } = await supabase.from("look_items").insert(
        look.items.map((item, i) => ({
          look_id: lookId,
          shade_id: item.shade_id,
          intensity: item.intensity,
          sort_order: i + 1,
        })),
      );
      if (error) return { ok: false, error: error.message };
    }
  }

  updateTag(tags.looks);
  updateTag(tags.shades);
  return { ok: true };
}
