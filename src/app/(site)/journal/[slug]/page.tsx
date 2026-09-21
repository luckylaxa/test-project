import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getJournalPost, getJournalSlugs, getSiteSettings, slugParams } from "@/lib/content";
import { buildMetadata, siteUrl } from "@/lib/metadata";

export async function generateStaticParams() {
  return slugParams(await getJournalSlugs());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getJournalPost(slug);
  return buildMetadata({
    title: post?.seo_title ?? post?.title,
    description: post?.seo_description ?? post?.excerpt,
    image: post?.seo_og_image_url ?? post?.cover_image_url,
    path: `/journal/${slug}`,
  });
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getJournalPost(slug), getSiteSettings()]);
  if (!post) notFound();

  const published = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.published_at ?? undefined,
    image: post.cover_image_url ? [`${siteUrl()}${post.cover_image_url}`] : undefined,
    publisher: settings?.brand_name
      ? { "@type": "Organization", name: settings.brand_name }
      : undefined,
    mainEntityOfPage: `${siteUrl()}/journal/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="pt-32 pb-24 md:pt-44 md:pb-32">
        <header className="shell mx-auto max-w-3xl text-center">
          {published ? <p className="eyebrow">{published}</p> : null}
          <h1 className="mt-5 text-4xl md:text-6xl">{post.title}</h1>
          {post.excerpt ? <p className="mt-7 text-lg text-ink-soft">{post.excerpt}</p> : null}
        </header>

        {post.cover_image_url ? (
          <div className="shell mt-14">
            <div className="relative overflow-hidden bg-canvas-soft" style={{ aspectRatio: "16 / 9" }}>
              <Image
                src={post.cover_image_url}
                alt={post.cover_image_alt ?? ""}
                fill
                sizes="100vw"
                priority
                className="object-cover"
              />
            </div>
          </div>
        ) : null}

        {post.body_html ? (
          <div className="shell mt-16">
            <div
              className="prose-editorial mx-auto max-w-3xl"
              dangerouslySetInnerHTML={{ __html: post.body_html }}
            />
          </div>
        ) : null}
      </article>
    </>
  );
}
