import { AdminHeader } from "@/components/admin/shell";
import { createClient } from "@/lib/supabase/server";
import { ModelsForm } from "./models-form";
import { requireAdmin } from "@/lib/admin/guard";

export const instant = false;

export default async function ModelsAdminPage() {
  // Authorization is checked here, not only in the layout: layouts and
  // pages render in parallel, so a page can query before a layout redirect
  // lands. RLS blocks anything private either way, but this stops the work.
  await requireAdmin();

  const supabase = await createClient();
  const { data } = await supabase.from("try_on_models").select("*").order("sort_order");

  return (
    <>
      <AdminHeader
        title="Try-on models"
        description="Sample faces visitors can use instead of their own camera. These photographs are also what you see when previewing a shade."
      />
      <ModelsForm models={data ?? []} />
    </>
  );
}
