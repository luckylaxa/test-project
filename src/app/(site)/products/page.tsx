import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductBrowser } from "@/components/shop/product-browser";
import { getPage, getProducts, getSiteSettings } from "@/lib/content";
import { makeLabels } from "@/lib/labels";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const [data, settings] = await Promise.all([getPage("products"), getSiteSettings()]);
  const labels = makeLabels(settings);
  return buildMetadata({
    title: data?.page.seo_title ?? data?.page.title ?? labels.t("shop_all"),
    description: data?.page.seo_description,
    image: data?.page.seo_og_image_url,
    path: "/products",
  });
}

/**
 * Every product in one place, searchable and sortable.
 *
 * There was no such page: the only routes into a product were the three
 * collections, the bestsellers strip on the home page, a look, or a related
 * card. Nothing listed the catalogue, and nothing searched it — so a customer
 * who knew the name of a shade had no way to find it.
 *
 * The grid is a client component reading the URL, wrapped in Suspense so this
 * page stays prerendered: the whole catalogue is in the HTML, and filtering
 * happens in the browser.
 */
export default async function AllProductsPage() {
  const [products, settings, pageData] = await Promise.all([
    getProducts(),
    getSiteSettings(),
    getPage("products"),
  ]);

  const labels = makeLabels(settings);
  const visible = products.filter((product) => product.is_visible);

  // Only offer a filter that matches something, so no option is a dead end.
  const categoryOptions = [...new Set(visible.map((p) => p.category))].map((value) => ({
    value,
    label: labels.category(value),
  }));
  const finishOptions = [
    ...new Set(
      visible.flatMap((p) => (p.shades ?? []).filter((s) => s.is_visible).map((s) => s.finish)),
    ),
  ].map((value) => ({ value, label: labels.finish(value) }));

  const title = pageData?.page.title ?? labels.t("shop_all");

  return (
    <section className="shell pt-32 pb-24 md:pt-44 md:pb-32">
      <Breadcrumbs
        trail={[
          { label: labels.t("breadcrumb_home"), href: "/" },
          { label: title, href: "/products" },
        ]}
      />
      <h1 className="mt-5 mb-12 text-5xl md:text-7xl">{title}</h1>

      <Suspense fallback={null}>
        <ProductBrowser
          products={visible}
          categoryOptions={categoryOptions}
          finishOptions={finishOptions}
          labels={{
            searchLabel: labels.t("search_label"),
            searchPlaceholder: labels.t("search_placeholder"),
            searchClear: labels.t("search_clear"),
            resultsFor: labels.t("search_results_for"),
            noResults: labels.t("search_no_results"),
            sortLabel: labels.t("sort_label"),
            sortFeatured: labels.t("sort_featured"),
            sortPriceAsc: labels.t("sort_price_asc"),
            sortPriceDesc: labels.t("sort_price_desc"),
            sortNameAsc: labels.t("sort_name_asc"),
            countOne: labels.t("result_count_one"),
            countMany: labels.t("result_count_many"),
            all: labels.t("filter_all"),
            category: labels.t("filter_category"),
            finish: labels.t("filter_finish"),
            clearFilters: labels.t("filter_clear"),
            empty: labels.t("no_products"),
          }}
        />
      </Suspense>
    </section>
  );
}
