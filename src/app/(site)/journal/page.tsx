import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RenderSections } from "@/components/sections/render";
import { Reveal } from "@/components/ui/reveal";
import { getJournalPosts, getPage, getSiteSettings } from "@/lib/content";
import { makeLabels } from "@/lib/labels";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPage("journal");
  return buildMetadata({
    title: data?.page.seo_title ?? data?.page.title,
    description: data?.page.seo_description,
    image: data?.page.seo_og_image_url,
    path: "/journal",
  });
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function JournalPage() {
  const [data, posts, settings] = await Promise.all([
    getPage("journal"),
    getJournalPosts(),
    getSiteSettings(),
  ]);
  const labels = makeLabels(settings);

  return (
    <>
      {data ? <RenderSections sections={data.sections} settings={settings} /> : null}

      <section className="shell pb-24 md:pb-32">
        {posts.length === 0 ? (
          <p className="text-sm text-ink-muted">{labels.t("empty_journal")}</p>
        ) : (
          <div className="grid gap-14 md:grid-cols-2 md:gap-x-12 md:gap-y-20">
            {posts.map((post, i) => (
              <Reveal as="article" key={post.id} delay={i * 90} className="group">
                <Link href={`/journal/${post.slug}`} className="block">
                  {post.cover_image_url ? (
                    <div
                      className="relative overflow-hidden bg-canvas-soft"
                      style={{ aspectRatio: "16 / 10" }}
                    >
                      <Image
                        src={post.cover_image_url}
                        alt={post.cover_image_alt ?? ""}
                        fill
                        sizes="(min-width:768px) 46vw, 92vw"
                        className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-editorial)] group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : null}
                  {formatDate(post.published_at) ? (
                    <p className="eyebrow mt-6">{formatDate(post.published_at)}</p>
                  ) : null}
                  <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-tight md:text-4xl">
                    {post.title}
                  </h2>
                  {post.excerpt ? <p className="measure mt-4 text-ink-soft">{post.excerpt}</p> : null}
                  <span
                    aria-hidden
                    className="mt-5 block h-px w-10 bg-ink/25 transition-all duration-700 ease-[var(--ease-editorial)] group-hover:w-20 group-hover:bg-accent"
                  />
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
