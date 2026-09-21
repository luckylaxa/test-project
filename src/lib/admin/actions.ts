"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "./guard";

export type ActionResult = { ok: true } | { ok: false; error: string };

type Supa = Awaited<ReturnType<typeof createClient>>;

/**
 * Every write goes through here, so no editor screen can forget to check
 * permission or to refresh the public site afterwards.
 *
 * Public pages are cached by tag (lib/cache-tags.ts). `updateTag` expires those
 * tags immediately rather than serving stale content while it refreshes, so an
 * editor who hits "Save & Publish" and then clicks "View Live Site" sees their
 * own change — not the previous version. No redeploy is involved.
 */
export async function withAdmin(
  tags: string[],
  write: (supabase: Supa) => PromiseLike<{ error: { message: string } | null }>,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await write(supabase);
  if (error) return { ok: false, error: error.message };

  for (const tag of tags) updateTag(tag);
  return { ok: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
