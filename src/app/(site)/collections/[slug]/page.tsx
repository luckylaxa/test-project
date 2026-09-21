import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCollection, getCollections, getSiteSettings, slugParams } from "@/lib/content";
import { makeLabels } from "@/lib/labels";
import { buildMetadata } from "@/lib/metadata";
import { ProductFilters } from "./filters";

export async function generateStaticParams() {
  const collections = await getCollections();
  return slugParams(collections.map((collection) => collection.slug));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  return buildMetadata({
    title: collection?.seo_title ?? collection?.name,
    description: collection?.seo_description ?? collection?.description,
    image: collection?.seo_og_image_url ?? collection?.hero_image_url,
    path: `/collections/${slug}`,
  });
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [collection, settings] = await Promise.all([getCollection(slug), getSiteSettings()]);
  if (!collection) notFound();

  const labels = makeLabels(settings);
  const products = collection.products;

  // Only offer filters that actually match something in this collection.
  const categoryOptions = [...new Set(products.map((p) => p.category))].map((value) => ({
    value,
    label: labels.category(value),
  }));
  const finishOptions = [
    ...new Set(products.flatMap((p) => (p.shades ?? []).filter((s) => s.is_visible).map((s) => s.finish))),
  ].map((value) => ({ value, label: labels.finish(value) }));

  return (
    <>
      {collection.hero_image_url ? (
        <section className="relative isolate min-h-[62svh] overflow-hidden md:min-h-[72svh]">
          <Image
            src={collection.hero_image_url}
            alt={collection.hero_image_alt ?? ""}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-ink/25" />
          <div className="relative z-10 flex min-h-[62svh] items-end pb-14 md:min-h-[72svh] md:pb-20">
            <div className="shell text-canvas">
              <h1 className="max-w-[14ch] text-5xl md:text-7xl">{collection.name}</h1>
              {collection.description ? (
                <p className="measure mt-6 text-canvas/85">{collection.description}</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : (
        <section className="shell pt-40 pb-12 md:pt-52">
          <h1 className="text-5xl md:text-7xl">{collection.name}</h1>
          {collection.description ? (
            <p className="measure mt-6 text-ink-soft">{collection.description}</p>
          ) : null}
        </section>
      )}

      <section className="shell py-16 md:py-24">
        {products.length > 0 ? (
          <ProductFilters
            products={products}
            categoryOptions={categoryOptions}
            finishOptions={finishOptions}
            labels={{
              all: labels.t("filter_all"),
              category: labels.t("filter_category"),
              finish: labels.t("filter_finish"),
              empty: labels.t("no_results"),
            }}
          />
        ) : (
          <p className="text-sm text-ink-muted">{labels.t("no_products")}</p>
        )}
      </section>
    </>
  );
}
