import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/shell";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "./product-form";
import { requireAdmin } from "@/lib/admin/guard";

export const instant = false;

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Authorization is checked here, not only in the layout: layouts and
  // pages render in parallel, so a page can query before a layout redirect
  // lands. RLS blocks anything private either way, but this stops the work.
  await requireAdmin();

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: collections }, { data: allProducts }, { data: model }, { data: settings }] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", id).maybeSingle(),
      supabase.from("collections").select("*").order("sort_order"),
      supabase.from("products").select("id, name").order("sort_order"),
      supabase
        .from("try_on_models")
        .select("photo_url")
        .not("photo_url", "is", null)
        .order("sort_order")
        .limit(1)
        .maybeSingle(),
      supabase.from("site_settings").select("currency, checkout_enabled").eq("id", 1).maybeSingle(),
    ]);

  if (!product) notFound();

  const [{ data: shades }, { data: related }] = await Promise.all([
    supabase.from("shades").select("*").eq("product_id", id).order("sort_order"),
    supabase
      .from("product_related")
      .select("related_product_id, sort_order")
      .eq("product_id", id)
      .order("sort_order"),
  ]);

  return (
    <>
      <AdminHeader
        title={product.name || "Product"}
        description="Everything about this product, including the shades people can try on."
        action={
          <Link
            href="/admin/products"
            className="border border-line px-5 py-2.5 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:border-ink"
          >
            All products
          </Link>
        }
      />
      <ProductForm
        product={product}
        shades={shades ?? []}
        collections={collections ?? []}
        allProducts={allProducts ?? []}
        related={(related ?? []).map((r) => r.related_product_id)}
        modelPhoto={model?.photo_url ?? null}
        currency={settings?.currency ?? "INR"}
        checkoutEnabled={settings?.checkout_enabled ?? false}
      />
    </>
  );
}
