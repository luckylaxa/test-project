import { AdminHeader } from "@/components/admin/shell";
import { createClient } from "@/lib/supabase/server";
import { getLooksWithItems, getProducts } from "@/lib/content";
import { LooksForm } from "./looks-form";
import { requireAdmin } from "@/lib/admin/guard";

export const instant = false;

export default async function LooksAdminPage() {
  // Authorization is checked here, not only in the layout: layouts and
  // pages render in parallel, so a page can query before a layout redirect
  // lands. RLS blocks anything private either way, but this stops the work.
  await requireAdmin();

  const supabase = await createClient();

  const [looks, products, { data: model }] = await Promise.all([
    getLooksWithItems(),
    getProducts(),
    supabase
      .from("try_on_models")
      .select("photo_url")
      .not("photo_url", "is", null)
      .order("sort_order")
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <>
      <AdminHeader
        title="Curated looks"
        description="Complete looks visitors can try on in one tap. Pick a shade from each product and watch it build on the model."
      />
      <LooksForm looks={looks} products={products} modelPhoto={model?.photo_url ?? null} />
    </>
  );
}
