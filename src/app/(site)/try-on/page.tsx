import type { Metadata } from "next";
import { Suspense } from "react";
import { Studio, type StudioLabels } from "@/components/try-on/studio";
import {
  getLooksWithItems,
  getPage,
  getProducts,
  getSiteSettings,
  getTryOnModels,
} from "@/lib/content";
import { makeLabels } from "@/lib/labels";
import { buildMetadata } from "@/lib/metadata";
import { Constants } from "@/lib/types/database";
import type { Category } from "@/lib/try-on/makeup-renderer";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPage("try-on");
  return buildMetadata({
    title: data?.page.seo_title ?? data?.page.title,
    description: data?.page.seo_description,
    image: data?.page.seo_og_image_url,
    path: "/try-on",
  });
}

export default async function TryOnPage() {
  const [products, looks, models, settings, pageData] = await Promise.all([
    getProducts(),
    getLooksWithItems(),
    getTryOnModels(),
    getSiteSettings(),
    getPage("try-on"),
  ]);

  const labels = makeLabels(settings);

  // Only offer categories that actually have a product with a visible shade.
  const stocked = new Set(
    products
      .filter((product) => (product.shades ?? []).some((shade) => shade.is_visible))
      .map((product) => product.category),
  );
  const categories = Constants.public.Enums.product_category
    .filter((value) => stocked.has(value))
    .map((value) => ({ value: value as Category, label: labels.category(value) }));

  const studioLabels: StudioLabels = {
    permissionTitle: settings?.camera_permission_title ?? null,
    permissionBody: settings?.camera_permission_body ?? null,
    disclaimer: settings?.try_on_disclaimer ?? null,
    startCamera: labels.t("try_on_start_camera"),
    upload: labels.t("try_on_upload"),
    models: labels.t("try_on_models"),
    cameraDenied: labels.t("try_on_camera_denied"),
    looks: labels.t("try_on_looks_tab"),
    viewProduct: labels.t("view_product"),
    tryLook: labels.t("try_on_look"),
    empty: labels.t("try_on_empty_category"),
    none: labels.t("try_on_none_applied"),
    clear: labels.t("try_on_clear"),
    intensity: labels.t("try_on_intensity"),
    compare: labels.t("try_on_compare"),
    snapshot: labels.t("try_on_snapshot"),
    searching: labels.t("try_on_searching"),
    loading: labels.t("try_on_loading"),
    error: labels.t("try_on_error"),
    products: labels.t("try_on_products"),
    close: labels.t("try_on_close"),
  };

  return (
    <div className="pt-20 lg:pt-24">
      {/* The studio is a full-bleed application surface with no room for a
          visible page title, but it still needs one heading for screen readers
          and search engines. Editable like every other page title. */}
      <h1 className="sr-only">{pageData?.page.title ?? ""}</h1>

      {/* useSearchParams needs a boundary so the shell around it still prerenders. */}
      <Suspense fallback={<div className="min-h-[70svh]" />}>
        <Studio
          products={products}
          looks={looks}
          models={models}
          categories={categories}
          labels={studioLabels}
        />
      </Suspense>
    </div>
  );
}
