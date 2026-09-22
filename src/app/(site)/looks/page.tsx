import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RenderSections } from "@/components/sections/render";
import { Reveal } from "@/components/ui/reveal";
import { Swatch } from "@/components/ui/swatch";
import { getLooksWithItems, getPage, getSiteSettings } from "@/lib/content";
import { makeLabels } from "@/lib/labels";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPage("looks");
  return buildMetadata({
    title: data?.page.seo_title ?? data?.page.title,
    description: data?.page.seo_description,
    image: data?.page.seo_og_image_url,
    path: "/looks",
  });
}

export default async function LooksPage() {
  const [data, looks, settings] = await Promise.all([
    getPage("looks"),
    getLooksWithItems(),
    getSiteSettings(),
  ]);
  const labels = makeLabels(settings);

  return (
    <>
      {data ? <RenderSections sections={data.sections} settings={settings} /> : null}

      <section className="shell pb-24 md:pb-32">
        {looks.length === 0 ? (
          <p className="text-sm text-ink-muted">{labels.t("empty_looks")}</p>
        ) : (
          <div className="space-y-24 md:space-y-32">
            {looks.map((look, index) => (
              <Reveal as="article" key={look.id}>
                <div
                  className={`grid items-center gap-10 md:grid-cols-12 md:gap-16 ${
                    index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  <div className="md:col-span-6">
                    <Link
                      href={`/try-on?look=${encodeURIComponent(look.slug)}`}
                      className="group block"
                    >
                      <div
                        className="relative overflow-hidden bg-canvas-soft"
                        style={{ aspectRatio: "4 / 5" }}
                      >
                        {look.cover_image_url ? (
                          <Image
                            src={look.cover_image_url}
                            alt={look.cover_image_alt ?? ""}
                            fill
                            sizes="(min-width:768px) 46vw, 90vw"
                            className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-editorial)] group-hover:scale-[1.03]"
                          />
                        ) : null}
                      </div>
                    </Link>
                  </div>

                  <div className="md:col-span-5 md:col-start-8">
                    <h2 className="text-4xl md:text-5xl">{look.name}</h2>
                    {look.description ? (
                      <p className="measure mt-5 text-ink-soft">{look.description}</p>
                    ) : null}

                    {look.items.length > 0 ? (
                      <div className="mt-8">
                        <p className="eyebrow">{labels.t("shades_in_look")}</p>
                        <ul className="mt-4 space-y-2.5">
                          {look.items.map((item) => (
                            <li key={item.id}>
                              <Link
                                href={`/products/${item.product.slug}`}
                                className="group flex items-center gap-3 text-sm"
                              >
                                <Swatch shade={item.shade} size={16} />
                                <span className="text-ink-soft transition-colors duration-300 group-hover:text-accent-text">
                                  {item.product.name}
                                  <span className="text-ink-muted"> · {item.shade.name}</span>
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <Link
                      href={`/try-on?look=${encodeURIComponent(look.slug)}`}
                      className="mt-9 inline-flex items-center justify-center border border-ink/25 px-8 py-3.5 text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-500 ease-[var(--ease-editorial)] hover:border-ink hover:bg-ink hover:text-canvas"
                    >
                      {labels.t("try_on_look")}
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
