import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminUser = { id: string; email: string };

/**
 * Gate for every admin route.
 *
 * Checks the signed-in user is present in `admins`. RLS would block their
 * writes anyway, so this is about showing an honest door rather than a panel
 * whose every save silently fails.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) redirect("/admin/login?denied=1");

  return { id: user.id, email: admin.email || user.email || "" };
}

/** Same check without redirecting, so the login page can bounce signed-in admins. */
export async function currentAdmin(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id, email")
    .eq("user_id", user.id)
    .maybeSingle();

  return admin ? { id: user.id, email: admin.email || user.email || "" } : null;
}
