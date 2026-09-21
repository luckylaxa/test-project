"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/admin/actions";

export async function setHandled(id: string, handled: boolean): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("enquiries").update({ is_handled: handled }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  // Enquiries are admin-only, so nothing public needs refreshing.
  revalidatePath("/admin/enquiries");
  return { ok: true };
}
