import type { Metadata } from "next";
import { RenderSections } from "@/components/sections/render";
import { CollectionCard } from "@/components/ui/cards";
import { getCollections, getPage, getSiteSettings } from "@/lib/content";
import { makeLabels } from "@/lib/labels";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPage("collections");
  return buildMetadata({
    title: data?.page.seo_title ?? data?.page.title,
    description: data?.page.seo_description,
    image: data?.page.seo_og_image_url,
    path: "/collections",
  });
}

export default async function CollectionsPage() {
  const [data, collections, settings] = await Promise.all([
    getPage("collections"),
    getCollections(),
    getSiteSettings(),
  ]);
  const labels = makeLabels(settings);

  return (
    <>
      {data ? <RenderSections sections={data.sections} settings={settings} /> : null}

      <section className="shell pb-24 md:pb-32">
        {collections.length > 0 ? (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            {collections.map((collection, i) => (
              <CollectionCard key={collection.id} collection={collection} delay={i * 90} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">{labels.t("no_products")}</p>
        )}
      </section>
    </>
  );
}
