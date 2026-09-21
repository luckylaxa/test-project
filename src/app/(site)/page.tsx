import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RenderSections } from "@/components/sections/render";
import { getPage, getSiteSettings } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPage("home");
  return buildMetadata({
    title: data?.page.seo_title ?? data?.page.title,
    description: data?.page.seo_description,
    image: data?.page.seo_og_image_url,
    path: "/",
  });
}

export default async function HomePage() {
  const [data, settings] = await Promise.all([getPage("home"), getSiteSettings()]);
  if (!data) notFound();

  return <RenderSections sections={data.sections} settings={settings} />;
}
