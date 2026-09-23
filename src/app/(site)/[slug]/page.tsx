import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { makeLabels } from "@/lib/labels";
import { links } from "@/lib/section-content";
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

  const labels = makeLabels(settings);
  // A policy page is a wall of text that simply stopped — measured as having no
  // onward action at all in its main content. The other policies are the useful
  // next step, and they are already content in `legal_links`.
  const siblings = links(settings?.legal_links).filter((link) => link.href !== `/${slug}`);
  const isPolicy = links(settings?.legal_links).some((link) => link.href === `/${slug}`);

  return (
    <>
      <RenderSections sections={data.sections} settings={settings} />
      {isPolicy && siblings.length > 0 ? (
        <nav aria-label={labels.t("policy_more")} className="shell pb-24">
          <p className="eyebrow border-t border-line pt-8">{labels.t("policy_more")}</p>
          <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
            {siblings.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="tap-sm text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:text-accent-text"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </>
  );
}
