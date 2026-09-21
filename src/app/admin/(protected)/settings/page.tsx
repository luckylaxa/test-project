import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/shell";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";
import { requireAdmin } from "@/lib/admin/guard";

export const instant = false;

export default async function SettingsPage() {
  // Authorization is checked here, not only in the layout: layouts and
  // pages render in parallel, so a page can query before a layout redirect
  // lands. RLS blocks anything private either way, but this stops the work.
  await requireAdmin();

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (!settings) notFound();

  return (
    <>
      <AdminHeader
        title="Site settings"
        description="The details that appear everywhere: your brand name, logo, menu, contact details and the wording of the try-on."
      />
      <SettingsForm settings={settings} />
    </>
  );
}
