"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { tags } from "@/lib/cache-tags";
import type { ActionResult } from "@/lib/admin/actions";
import type { Json } from "@/lib/types/database";
import type { Database } from "@/lib/types/database";

type SectionType = Database["public"]["Enums"]["section_type"];

export async function savePage(
  pageId: string,
  slug: string,
  page: { title: string; seo_title: string | null; seo_description: string | null; is_published: boolean },
  sections: { id?: string; type: SectionType; content: Json; is_visible: boolean }[],
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const pageSaved = await supabase.from("pages").update(page).eq("id", pageId);
  if (pageSaved.error) return { ok: false, error: pageSaved.error.message };

  const keep = sections.map((s) => s.id).filter(Boolean) as string[];
  const removal =
    keep.length > 0
      ? await supabase.from("sections").delete().eq("page_id", pageId).not("id", "in", `(${keep.join(",")})`)
      : await supabase.from("sections").delete().eq("page_id", pageId);
  if (removal.error) return { ok: false, error: removal.error.message };

  for (const [index, section] of sections.entries()) {
    const row = {
      page_id: pageId,
      type: section.type,
      content: section.content,
      is_visible: section.is_visible,
      sort_order: index + 1,
    };
    const { error } = section.id
      ? await supabase.from("sections").update(row).eq("id", section.id)
      : await supabase.from("sections").insert(row);
    if (error) return { ok: false, error: error.message };
  }

  updateTag(tags.pages);
  updateTag(tags.page(slug));
  return { ok: true };
}
