import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink, TextLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { CollectionCard, LookCard, ProductCard } from "@/components/ui/cards";
import { link, listItems, media, obj, text, num } from "@/lib/section-content";
import type { Json } from "@/lib/types/database";
import type {
  CollectionRow,
  LookRow,
  PressRow,
  ProductWithShades,
  TestimonialRow,
} from "@/lib/content";
import type { Labels } from "@/lib/labels";

/** Asymmetric image + text block, used by brand_story and image_text. */
export function ImageTextSection({ content }: { content: Json }) {
  const c = obj(content);
  const eyebrow = text(c.eyebrow);
  const headline = text(c.headline);
  const body = text(c.body);
  const image = media(c.image);
  const button = link(c.button);
  const imageLeft = text(c.image_side) !== "right";

  if (!eyebrow && !headline && !body && !image && !button) return null;

  return (
    <section className="shell py-24 md:py-32">
      <div className="grid items-center gap-12 md:grid-cols-12 md:gap-16">
        {image ? (
          <Reveal className={`md:col-span-6 ${imageLeft ? "" : "md:order-2"}`}>
            <div className="relative overflow-hidden bg-canvas-soft" style={{ aspectRatio: "4 / 5" }}>
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="(min-width:768px) 46vw, 90vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        ) : null}

        <div className={image ? "md:col-span-5 md:col-start-8" : "md:col-span-8 md:col-start-3"}>
          <SectionHeading eyebrow={eyebrow} headline={headline}>
            {body ? <p className="measure mt-7 whitespace-pre-line text-ink-soft">{body}</p> : null}
            {button ? (
              <div className="mt-9">
                <ButtonLink content={button} variant="line" />
              </div>
            ) : null}
          </SectionHeading>
        </div>
      </div>
    </section>
  );
}

/** Collections grid. */
export function CollectionsSection({
  content,
  collections,
  labels,
}: {
  content: Json;
  collections: CollectionRow[];
  labels: Labels;
}) {
  const c = obj(content);
  const cta = link(c.link);

  if (collections.length === 0 && !text(c.headline)) return null;

  return (
    <section className="shell py-24 md:py-32">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <SectionHeading eyebrow={text(c.eyebrow)} headline={text(c.headline)} subtext={text(c.subtext)} />
        {cta ? <TextLink content={cta} className="pb-2" /> : null}
      </div>

      {collections.length > 0 ? (
        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {collections.map((collection, i) => (
            <CollectionCard key={collection.id} collection={collection} delay={i * 90} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-sm text-ink-muted">{labels.t("no_products")}</p>
      )}
    </section>
  );
}

/** Product grid, shared by bestsellers. */
export function ProductsSection({
  content,
  products,
  labels,
}: {
  content: Json;
  products: ProductWithShades[];
  labels: Labels;
}) {
  const c = obj(content);
  const cta = link(c.link);
  const limit = num(c.limit);
  const shown = limit && limit > 0 ? products.slice(0, limit) : products;

  if (shown.length === 0 && !text(c.headline)) return null;

  return (
    <section className="shell py-24 md:py-32">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <SectionHeading eyebrow={text(c.eyebrow)} headline={text(c.headline)} subtext={text(c.subtext)} />
        {cta ? <TextLink content={cta} className="pb-2" /> : null}
      </div>

      {shown.length > 0 ? (
        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4 lg:gap-x-10">
          {shown.map((product, i) => (
            <ProductCard key={product.id} product={product} delay={i * 80} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-sm text-ink-muted">{labels.t("no_products")}</p>
      )}
    </section>
  );
}

/** Curated looks grid. */
export function LooksSection({
  content,
  looks,
  labels,
}: {
  content: Json;
  looks: LookRow[];
  labels: Labels;
}) {
  const c = obj(content);
  const cta = link(c.link);

  if (looks.length === 0 && !text(c.headline)) return null;

  return (
    <section className="bg-canvas-soft py-24 md:py-32">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading eyebrow={text(c.eyebrow)} headline={text(c.headline)} subtext={text(c.subtext)} />
          {cta ? <TextLink content={cta} className="pb-2" /> : null}
        </div>

        {looks.length > 0 ? (
          <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4 lg:gap-x-10">
            {looks.map((look, i) => (
              <LookCard key={look.id} look={look} tryOnLabel={labels.t("try_on_look")} delay={i * 80} />
            ))}
          </div>
        ) : (
          <p className="mt-12 text-sm text-ink-muted">{labels.t("empty_looks")}</p>
        )}
      </div>
    </section>
  );
}

/** Try-on feature: split image and copy, with the studio call to action. */
export function TryOnFeatureSection({ content }: { content: Json }) {
  const c = obj(content);
  const image = media(c.image);
  const button = link(c.button);
  const headline = text(c.headline);

  if (!headline && !image && !button && !text(c.subtext)) return null;

  return (
    <section className="bg-ink py-24 text-canvas md:py-32">
      <div className="shell grid items-center gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-5">
          <Reveal>
            {text(c.eyebrow) ? <p className="eyebrow text-canvas/60">{text(c.eyebrow)}</p> : null}
            {headline ? <h2 className="mt-5 text-4xl md:text-5xl lg:text-6xl">{headline}</h2> : null}
            {text(c.subtext) ? (
              <p className="measure mt-6 text-canvas/75">{text(c.subtext)}</p>
            ) : null}
            {button ? (
              <div className="mt-9">
                <ButtonLink content={button} variant="quiet" />
              </div>
            ) : null}
          </Reveal>
        </div>

        {image ? (
          <Reveal className="md:col-span-6 md:col-start-7">
            <div className="relative overflow-hidden" style={{ aspectRatio: "5 / 4" }}>
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="(min-width:768px) 48vw, 90vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}

/** Craft highlights: a four-up of short titled notes. */
export function CraftSection({ content }: { content: Json }) {
  const c = obj(content);
  const items = listItems(c.items);
  if (items.length === 0 && !text(c.headline)) return null;

  return (
    <section className="shell py-24 md:py-32">
      <SectionHeading eyebrow={text(c.eyebrow)} headline={text(c.headline)} subtext={text(c.subtext)} />
      {items.length > 0 ? (
        <ul className="mt-16 grid gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <Reveal as="li" key={`${item.title}-${i}`} delay={i * 80} className="bg-canvas p-8 lg:p-10">
              {item.title ? (
                <h3 className="font-[family-name:var(--font-display)] text-2xl leading-tight">{item.title}</h3>
              ) : null}
              {item.description ? <p className="mt-4 text-sm text-ink-soft">{item.description}</p> : null}
            </Reveal>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Testimonials. */
export function TestimonialsSection({
  content,
  testimonials,
}: {
  content: Json;
  testimonials: TestimonialRow[];
}) {
  const c = obj(content);
  if (testimonials.length === 0) return null;

  return (
    <section className="shell py-24 md:py-32">
      <SectionHeading eyebrow={text(c.eyebrow)} headline={text(c.headline)} align="center" />
      <ul className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
        {testimonials.map((item, i) => (
          <Reveal as="li" key={item.id} delay={i * 90} className="text-center">
            <figure>
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.image_alt ?? ""}
                  width={72}
                  height={72}
                  className="mx-auto mb-6 h-18 w-18 rounded-full object-cover"
                />
              ) : null}
              {item.quote ? (
                <blockquote className="font-[family-name:var(--font-display)] text-2xl leading-snug text-balance">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
              ) : null}
              <figcaption className="mt-5 text-[0.6875rem] tracking-[0.18em] text-ink-muted uppercase">
                {item.author_name}
                {item.author_role ? <span className="text-ink-muted/70"> · {item.author_role}</span> : null}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/** "As seen in" logo row. */
export function PressSection({ content, logos }: { content: Json; logos: PressRow[] }) {
  const c = obj(content);
  if (logos.length === 0) return null;

  return (
    <section className="border-y border-line py-16">
      <div className="shell">
        <SectionHeading eyebrow={text(c.eyebrow)} headline={text(c.headline)} align="center" />
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-8 md:gap-x-20">
          {logos.map((logo, i) => {
            const mark = logo.logo_url ? (
              <Image
                src={logo.logo_url}
                alt={logo.logo_alt ?? logo.name}
                width={160}
                height={40}
                className="h-7 w-auto opacity-45 transition-opacity duration-500 hover:opacity-80"
              />
            ) : (
              <span className="text-[0.75rem] tracking-[0.2em] text-ink-muted uppercase">{logo.name}</span>
            );
            return (
              <Reveal as="li" key={logo.id} delay={i * 60}>
                {logo.link_url ? (
                  <a href={logo.link_url} target="_blank" rel="noopener noreferrer">
                    {mark}
                  </a>
                ) : (
                  mark
                )}
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** Long-form rich text, used for the legal pages and any prose section. */
export function RichTextSection({ content }: { content: Json }) {
  const c = obj(content);
  const html = text(c.body_html);
  const headline = text(c.headline);
  if (!html && !headline) return null;

  return (
    <section className="shell py-24 md:py-32">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow={text(c.eyebrow)} headline={headline} />
        {html ? <div className="prose-editorial mt-10" dangerouslySetInnerHTML={{ __html: html }} /> : null}
      </div>
    </section>
  );
}
