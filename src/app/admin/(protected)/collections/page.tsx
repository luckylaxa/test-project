import { AdminHeader } from "@/components/admin/shell";
import { createClient } from "@/lib/supabase/server";
import { CollectionsForm } from "./collections-form";
import { requireAdmin } from "@/lib/admin/guard";

export const instant = false;

export default async function CollectionsAdminPage() {
  // Authorization is checked here, not only in the layout: layouts and
  // pages render in parallel, so a page can query before a layout redirect
  // lands. RLS blocks anything private either way, but this stops the work.
  await requireAdmin();

  const supabase = await createClient();
  const { data } = await supabase.from("collections").select("*").order("sort_order");

  return (
    <>
      <AdminHeader
        title="Collections"
        description="The groups products are sorted into. Drag to change the order they appear in."
      />
      <CollectionsForm collections={data ?? []} />
    </>
  );
}
