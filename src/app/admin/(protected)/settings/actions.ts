"use server";

import { withAdmin, type ActionResult } from "@/lib/admin/actions";
import { tags } from "@/lib/cache-tags";
import type { TablesUpdate } from "@/lib/types/database";

export async function saveSettings(
  patch: TablesUpdate<"site_settings">,
): Promise<ActionResult> {
  // Settings appear on every page, so refresh everything that reads them.
  return withAdmin([tags.settings, tags.pages, tags.products, tags.collections], (supabase) =>
    supabase.from("site_settings").update(patch).eq("id", 1),
  );
}
