"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { tags } from "@/lib/cache-tags";
import type { ActionResult } from "@/lib/admin/actions";

export type PostInput = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  body_html: string;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
};

export async function saveposts(posts: PostInput[]): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const keep = posts.map((p) => p.id).filter(Boolean) as string[];
  const removal =
    keep.length > 0
      ? await supabase.from("journal_posts").delete().not("id", "in", `(${keep.join(",")})`)
      : await supabase.from("journal_posts").delete().not("id", "is", null);
  if (removal.error) return { ok: false, error: removal.error.message };

  for (const post of posts) {
    const { id, ...row } = post;
    const { error } = id
      ? await supabase.from("journal_posts").update(row).eq("id", id)
      : await supabase.from("journal_posts").insert(row);
    if (error) return { ok: false, error: error.message };
    if (id) updateTag(tags.journalPost(post.slug));
  }

  updateTag(tags.journal);
  return { ok: true };
}
