import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accordion } from "@/components/ui/accordion";
import { ProductCard } from "@/components/ui/cards";
import { Reveal } from "@/components/ui/reveal";
import { getProduct, getProductSlugs, getSiteSettings, slugParams } from "@/lib/content";
import { gallery } from "@/lib/section-content";
import { makeLabels } from "@/lib/labels";
import { buildMetadata, siteUrl } from "@/lib/metadata";
import { jsonLdScript } from "@/lib/sanitize";
import { GalleryAndShades } from "./gallery-and-shades";

export async function generateStaticParams() {
  return slugParams(await getProductSlugs());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  const images = gallery(product?.gallery);
  return buildMetadata({
    title: product?.seo_title ?? product?.name,
    description: product?.seo_description ?? product?.short_description,
    image: product?.seo_og_image_url ?? images[0]?.url,
    path: `/products/${slug}`,
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProduct(slug), getSiteSettings()]);
  if (!product) notFound();

  const labels = makeLabels(settings);
  const images = gallery(product.gallery);
  const shades = (product.shades ?? []).filter((s) => s.is_visible);
  const finishLabels = Object.fromEntries(
    shades.map((s) => [s.finish, labels.finish(s.finish)]),
  );

  const accordionItems = [
    { title: labels.t("product_details"), body: product.details },
    { title: labels.t("product_ingredients"), body: product.ingredients },
    { title: labels.t("product_how_to_apply"), body: product.how_to_apply },
  ]
    .filter((item): item is { title: string; body: string } => Boolean(item.title && item.body));

  const shopLink =
    product.shop_url && product.shop_label
      ? { label: product.shop_label, href: product.shop_url }
      : null;

  // Product structured data, with one offer per shade.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description ?? undefined,
    image: images.map((image) => `${siteUrl()}${image.url}`),
    brand: settings?.brand_name ? { "@type": "Brand", name: settings.brand_name } : undefined,
    category: labels.category(product.category),
    url: `${siteUrl()}/products/${product.slug}`,
    ...(shades.length > 0
      ? {
          hasVariant: shades.map((shade) => ({
            "@type": "Product",
            name: `${product.name} — ${shade.name}`,
            color: shade.hex,
          })),
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />

      <article className="shell pt-32 pb-24 md:pt-44 md:pb-32">
        <header className="mb-12 md:mb-16">
          {product.collection ? (
            <Link href={`/collections/${product.collection.slug}`} className="eyebrow hover:text-accent-text">
              {product.collection.name}
            </Link>
          ) : (
            <p className="eyebrow">{labels.category(product.category)}</p>
          )}
          <h1 className="mt-5 text-5xl md:text-7xl">{product.name}</h1>
          {product.short_description ? (
            <p className="measure mt-6 text-lg text-ink-soft">{product.short_description}</p>
          ) : null}
          {product.price_display ? (
            <p className="mt-5 text-[0.8125rem] tracking-[0.14em] text-ink-muted">
              {product.price_display}
            </p>
          ) : null}
        </header>

        <GalleryAndShades
          images={images}
          shades={shades}
          productSlug={product.slug}
          productId={product.id}
          purchasable={Boolean(
            settings?.checkout_enabled && product.is_purchasable && (product.price_amount ?? 0) > 0,
          )}
          labels={{
            chooseShade: labels.t("choose_shade"),
            tryOnShade: labels.t("try_on_shade"),
            addToCart: labels.t("add_to_cart"),
          }}
          finishLabels={finishLabels}
        />

        {shopLink ? (
          <div className="mt-10">
            <a
              href={shopLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-ink/25 px-8 py-3.5 text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-500 ease-[var(--ease-editorial)] hover:border-ink hover:bg-ink hover:text-canvas"
            >
              {shopLink.label}
            </a>
          </div>
        ) : null}

        {accordionItems.length > 0 ? (
          <div className="mt-20 grid md:grid-cols-12">
            <div className="md:col-span-7">
              <Accordion items={accordionItems} headingLevel={2} />
            </div>
          </div>
        ) : null}
      </article>

      {product.related.length > 0 ? (
        <section className="border-t border-line py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <h2 className="text-3xl md:text-4xl">{labels.t("complete_the_look")}</h2>
            </Reveal>
            <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4 lg:gap-x-10">
              {product.related.map((related, i) => (
                <ProductCard
                  key={related.id}
                  product={{ ...related, shades: [] }}
                  headingLevel={3}
                  delay={i * 80}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
