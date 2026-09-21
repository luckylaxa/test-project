"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "./guard";
import { createClient } from "@/lib/supabase/server";
import { tags } from "@/lib/cache-tags";
import type { ActionResult } from "./actions";

type Table = "collections" | "testimonials" | "press_logos" | "try_on_models";

const TAGS: Record<Table, string[]> = {
  collections: [tags.collections, tags.products],
  testimonials: [tags.testimonials],
  press_logos: [tags.press],
  try_on_models: [tags.tryOnModels],
};

/**
 * Replaces every row of a small, ordered table.
 *
 * Rows the editor removed are deleted, the rest are inserted or updated, and
 * sort_order is rewritten from the list order so what they see is what the site
 * shows.
 */
export async function saveRows(
  table: Table,
  rows: (Record<string, unknown> & { id?: string })[],
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const keep = rows.map((row) => row.id).filter(Boolean) as string[];

  const removal =
    keep.length > 0
      ? await supabase.from(table).delete().not("id", "in", `(${keep.join(",")})`)
      : await supabase.from(table).delete().not("id", "is", null);
  if (removal.error) return { ok: false, error: removal.error.message };

  for (const [index, row] of rows.entries()) {
    const { id, ...fields } = row;
    const payload = { ...fields, sort_order: index + 1 };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from(table) as any;
    const { error } = id
      ? await query.update(payload).eq("id", id)
      : await query.insert(payload);
    if (error) return { ok: false, error: error.message };
  }

  for (const tag of TAGS[table]) updateTag(tag);
  return { ok: true };
}
