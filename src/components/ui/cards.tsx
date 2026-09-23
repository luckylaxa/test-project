"use client";

import Image from "next/image";
import Link from "next/link";
import type { CollectionRow, LookRow, ProductWithShades } from "@/lib/content";
import { gallery } from "@/lib/section-content";
import { Swatch } from "./swatch";
import { Reveal } from "./reveal";
import { SaveHeart } from "./save-heart";
import { useShop } from "./shop-provider";
import { QuickAdd } from "@/components/cart/quick-add";
import { canSell, isSoldOut } from "@/lib/cart/sellable";

/** Product card: image reveals on hover, shades summarised beneath. */
export function ProductCard({
  product,
  delay = 0,
  sizes = "(min-width:1280px) 22vw, (min-width:768px) 30vw, 45vw",
  headingLevel = 3,
}: {
  product: ProductWithShades;
  delay?: number;
  sizes?: string;
  /** 2 when the cards sit directly under a page h1, 3 under a section h2. */
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const images = gallery(product.gallery);
  const primary = images[0];
  const secondary = images[1];
  const shades = (product.shades ?? []).filter((s) => s.is_visible);
  const { checkoutEnabled, labels } = useShop();
  const href = `/products/${product.slug}`;

  // Stock decides whether a card offers to sell, by the same rule the product
  // page, the studio and the server all use.
  const inStockShades = shades.filter((s) => s.is_in_stock);
  const soldOut = isSoldOut(product, shades);
  const purchasable = canSell({ checkoutEnabled, product }) && !soldOut;

  return (
    <Reveal as="article" delay={delay} className="group flex h-full flex-col">
      <div className="relative">
      <Link href={href} className="block">
        <div className="relative overflow-hidden bg-canvas-soft" style={{ aspectRatio: "4 / 5" }}>
          {primary ? (
            <Image
              src={primary.url}
              alt={primary.alt}
              fill
              sizes={sizes}
              className={`object-cover transition-all duration-[1200ms] ease-[var(--ease-editorial)] ${
                secondary ? "group-hover:opacity-0" : "group-hover:scale-[1.03]"
              }`}
            />
          ) : null}
          {secondary ? (
            <Image
              src={secondary.url}
              alt={secondary.alt}
              fill
              sizes={sizes}
              className="object-cover opacity-0 transition-opacity duration-[1200ms] ease-[var(--ease-editorial)] group-hover:opacity-100"
            />
          ) : null}
        </div>
      </Link>
        {/* Outside the link on purpose: a <button> inside an <a> is invalid, and
            the click would follow the card instead of saving. */}
        <SaveHeart
          productId={product.id}
          labels={{ add: labels.save, remove: labels.saved }}
          className="absolute top-0.5 right-0.5 z-10"
        />

        {soldOut ? (
          <span className="absolute top-3 left-3 z-10 bg-canvas/95 px-2.5 py-1 text-[0.5625rem] tracking-[0.16em] text-ink uppercase">
            {labels.stockOut}
          </span>
        ) : product.stock_status === "low_stock" ? (
          <span className="absolute top-3 left-3 z-10 bg-canvas/95 px-2.5 py-1 text-[0.5625rem] tracking-[0.16em] text-accent-text uppercase">
            {labels.stockLow}
          </span>
        ) : null}
      </div>

        <div className="mt-5 flex flex-1 flex-col">
          <Link href={href} className="block">
          <Heading className="font-[family-name:var(--font-display)] text-2xl leading-tight">
            {product.name}
          </Heading>
          {product.short_description ? (
            <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{product.short_description}</p>
          ) : null}
          </Link>

          {/* Wraps rather than overflows. In a two-column grid at 375px the card is
              ~160px wide, and five swatches plus a price do not fit on one line —
              `justify-between` has nothing to give, so the price hung 4px past the
              viewport and the whole page scrolled sideways. */}
          <div className="mt-4 flex flex-1 flex-wrap items-start justify-between gap-x-4 gap-y-2">
            {shades.length > 0 ? (
              <span className="flex items-center gap-1.5">
                {shades.slice(0, 5).map((shade) => (
                  <Swatch key={shade.id} shade={shade} size={14} />
                ))}
                {shades.length > 5 ? (
                  <span className="ml-1 text-[0.625rem] tracking-[0.12em] text-ink-muted">
                    +{shades.length - 5}
                  </span>
                ) : null}
              </span>
            ) : (
              <span />
            )}
            {product.price_display ? (
              <span className="text-[0.6875rem] tracking-[0.14em] text-ink-muted">
                {product.price_display}
              </span>
            ) : null}
          </div>

          {purchasable ? (
            <div className="mt-4">
              <QuickAdd
                productId={product.id}
                shades={inStockShades}
                labels={{ add: labels.add, chooseShade: labels.chooseShade, close: labels.close }}
              />
            </div>
          ) : null}
        </div>
    </Reveal>
  );
}

/** Collection card: tall editorial crop with the name over the image foot. */
export function CollectionCard({
  collection,
  delay = 0,
  sizes = "(min-width:768px) 32vw, 90vw",
  headingLevel = 3,
}: {
  collection: CollectionRow;
  delay?: number;
  sizes?: string;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <Reveal as="article" delay={delay} className="group">
      <Link href={`/collections/${collection.slug}`} className="block">
        <div className="relative overflow-hidden bg-canvas-soft" style={{ aspectRatio: "4 / 5" }}>
          {collection.hero_image_url ? (
            <Image
              src={collection.hero_image_url}
              alt={collection.hero_image_alt ?? ""}
              fill
              sizes={sizes}
              className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-editorial)] group-hover:scale-[1.04]"
            />
          ) : null}
        </div>
        <Heading className="mt-6 font-[family-name:var(--font-display)] text-3xl">
          {collection.name}
        </Heading>
        {collection.description ? (
          <p className="measure mt-3 line-clamp-3 text-sm text-ink-soft">{collection.description}</p>
        ) : null}
        <span
          aria-hidden
          className="mt-5 block h-px w-10 bg-ink/25 transition-all duration-700 ease-[var(--ease-editorial)] group-hover:w-20 group-hover:bg-accent"
        />
      </Link>
    </Reveal>
  );
}

/** Look card, linking straight into the studio with the look preselected. */
export function LookCard({
  look,
  tryOnLabel,
  delay = 0,
  sizes = "(min-width:1280px) 24vw, (min-width:768px) 40vw, 85vw",
}: {
  look: LookRow;
  tryOnLabel: string;
  delay?: number;
  sizes?: string;
}) {
  return (
    <Reveal as="article" delay={delay} className="group">
      <Link href={`/try-on?look=${encodeURIComponent(look.slug)}`} className="block">
        <div className="relative overflow-hidden bg-canvas-soft" style={{ aspectRatio: "4 / 5" }}>
          {look.cover_image_url ? (
            <Image
              src={look.cover_image_url}
              alt={look.cover_image_alt ?? ""}
              fill
              sizes={sizes}
              className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-editorial)] group-hover:scale-[1.04]"
            />
          ) : null}
          <span className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center bg-gradient-to-t from-ink/55 to-transparent pt-16 pb-5 text-[0.625rem] tracking-[0.2em] text-canvas uppercase opacity-0 transition-all duration-700 ease-[var(--ease-editorial)] group-hover:translate-y-0 group-hover:opacity-100">
            {tryOnLabel}
          </span>
        </div>
        <h3 className="mt-5 font-[family-name:var(--font-display)] text-2xl">{look.name}</h3>
        {look.description ? (
          <p className="measure mt-2 line-clamp-2 text-sm text-ink-soft">{look.description}</p>
        ) : null}
      </Link>
    </Reveal>
  );
}
