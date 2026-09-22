"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Swatch } from "@/components/ui/swatch";
import { AddToCart } from "@/components/cart/add-to-cart";
import type { ShadeRow } from "@/lib/content";
import type { GalleryImage } from "@/lib/section-content";

/**
 * Product gallery with a shade selector.
 * Choosing a shade updates the "Try This Shade" link so the studio opens with
 * that exact shade preselected.
 */
export function GalleryAndShades({
  images,
  shades,
  productSlug,
  productId,
  purchasable,
  labels,
  finishLabels,
}: {
  images: GalleryImage[];
  shades: ShadeRow[];
  productSlug: string;
  productId: string;
  /** False when the shop is closed or the product has no price yet. */
  purchasable: boolean;
  labels: { chooseShade: string; tryOnShade: string; addToCart: string };
  finishLabels: Record<string, string>;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [activeShade, setActiveShade] = useState(0);
  const shade = shades[activeShade];

  return (
    <div className="grid gap-12 md:grid-cols-12 md:gap-16">
      {/* Gallery */}
      <div className="md:col-span-7">
        {images.length > 0 ? (
          <>
            <div className="relative overflow-hidden bg-canvas-soft" style={{ aspectRatio: "4 / 5" }}>
              <Image
                src={images[activeImage].url}
                alt={images[activeImage].alt}
                fill
                sizes="(min-width:768px) 56vw, 100vw"
                priority
                className="object-cover"
              />
            </div>

            {images.length > 1 ? (
              <ul className="mt-4 flex gap-3">
                {images.map((image, i) => (
                  <li key={image.url + i}>
                    <button
                      type="button"
                      onClick={() => setActiveImage(i)}
                      aria-label={image.alt || `Image ${i + 1}`}
                      aria-current={i === activeImage}
                      className={`relative block h-20 w-16 overflow-hidden bg-canvas-soft transition-opacity duration-300 ${
                        i === activeImage ? "opacity-100" : "opacity-45 hover:opacity-75"
                      }`}
                    >
                      <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
      </div>

      {/* Shades */}
      <div className="md:col-span-5">
        {shades.length > 0 ? (
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <p className="eyebrow">{labels.chooseShade}</p>
              {shade ? (
                <p className="text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase">
                  {finishLabels[shade.finish] ?? shade.finish}
                </p>
              ) : null}
            </div>

            <ul className="mt-5 flex flex-wrap gap-3">
              {shades.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setActiveShade(i)}
                    aria-pressed={i === activeShade}
                    aria-label={s.name}
                    className={`block rounded-full p-0.5 transition-all duration-300 ${
                      i === activeShade ? "ring-1 ring-ink" : "ring-1 ring-transparent hover:ring-ink/25"
                    }`}
                  >
                    <Swatch shade={s} size={34} />
                  </button>
                </li>
              ))}
            </ul>

            {shade ? (
              <p className="mt-5 font-[family-name:var(--font-display)] text-2xl">{shade.name}</p>
            ) : null}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {purchasable ? (
                <AddToCart
                  productId={productId}
                  shadeId={shade?.id ?? null}
                  label={labels.addToCart}
                  className="w-full sm:w-auto"
                />
              ) : null}

              <Link
                href={`/try-on?product=${encodeURIComponent(productSlug)}${
                  shade ? `&shade=${encodeURIComponent(shade.id)}` : ""
                }`}
                className={`inline-flex w-full items-center justify-center px-8 py-4 text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-500 ease-[var(--ease-editorial)] sm:w-auto ${
                  purchasable
                    ? "border border-ink/25 hover:border-ink hover:bg-ink hover:text-canvas"
                    : "bg-ink text-canvas hover:bg-accent hover:text-ink"
                }`}
              >
                {labels.tryOnShade}
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
