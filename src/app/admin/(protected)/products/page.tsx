import { AdminHeader } from "@/components/admin/shell";
import { createClient } from "@/lib/supabase/server";
import { ProductList } from "./product-list";
import { NewProduct } from "./new-product";
import { requireAdmin } from "@/lib/admin/guard";

export const instant = false;

export default async function ProductsPage() {
  // Authorization is checked here, not only in the layout: layouts and
  // pages render in parallel, so a page can query before a layout redirect
  // lands. RLS blocks anything private either way, but this stops the work.
  await requireAdmin();

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, shades(id, hex, is_visible)")
    .order("sort_order")
    .order("sort_order", { referencedTable: "shades" });

  return (
    <>
      <AdminHeader
        title="Products & shades"
        description="Every product on the site, and the shades people can try on."
        action={<NewProduct />}
      />
      <ProductList products={data ?? []} />
    </>
  );
}
