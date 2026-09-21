import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RenderSections } from "@/components/sections/render";
import { getPage, getPageSlugs, getSiteSettings, slugParams } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";

/** Slugs that have a dedicated route of their own. */
const RESERVED = new Set(["home", "collections", "looks", "journal", "products", "try-on", "admin"]);

export async function generateStaticParams() {
  const slugs = await getPageSlugs();
  return slugParams(slugs.filter((slug) => !RESERVED.has(slug)));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPage(slug);
  return buildMetadata({
    title: data?.page.seo_title ?? data?.page.title,
    description: data?.page.seo_description,
    image: data?.page.seo_og_image_url,
    path: `/${slug}`,
  });
}

/**
 * Renders any page the editor creates, from its sections alone.
 * About, Contact and the legal pages all come through here, which means a new
 * page needs no code.
 */
export default async function GenericPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (RESERVED.has(slug)) notFound();

  const [data, settings] = await Promise.all([getPage(slug), getSiteSettings()]);
  if (!data) notFound();

  return <RenderSections sections={data.sections} settings={settings} />;
}
