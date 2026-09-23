"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Swatch } from "@/components/ui/swatch";
import { AddToCart } from "@/components/cart/add-to-cart";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import type { ShadeRow } from "@/lib/content";
import type { GalleryImage } from "@/lib/section-content";

export type BuyLabels = {
  chooseShade: string;
  tryOnShade: string;
  addToCart: string;
  stockLow: string;
  stockOut: string;
  quantity: string;
  quantityDecrease: string;
  quantityIncrease: string;
  quantityMax: string;
};

/**
 * Product gallery, shade selector and the buy controls.
 *
 * Choosing a shade updates the "Try This Shade" link so the studio opens with
 * that exact shade preselected.
 *
 * The buy column renders whether or not the product has shades. It used to sit
 * inside `shades.length > 0`, so a product without shades had no Add to basket
 * button anywhere on its own page — it could only be bought from a card
 * elsewhere on the site.
 */
export function GalleryAndShades({
  images,
  shades,
  productSlug,
  productId,
  purchasable,
  soldOut,
  lowStock,
  labels,
  finishLabels,
}: {
  images: GalleryImage[];
  shades: ShadeRow[];
  productSlug: string;
  productId: string;
  /** False when the shop is closed or the product has no price yet. */
  purchasable: boolean;
  /** The whole product has sold out. */
  soldOut: boolean;
  lowStock: boolean;
  labels: BuyLabels;
  finishLabels: Record<string, string>;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [activeShade, setActiveShade] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const shade = shades[activeShade];

  // A sold-out shade is still selectable: someone should be able to look at a
  // colour and read that it has gone, rather than find an unexplained gap.
  const shadeSoldOut = Boolean(shade && !shade.is_in_stock);
  const canBuy = purchasable && !soldOut && !shadeSoldOut;

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
                      aria-label={image.alt || `${i + 1}`}
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

      {/* Shades and buying */}
      <div className="md:col-span-5">
        {shades.length > 0 ? (
          <div className="mb-8">
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
                    onClick={() => {
                      setActiveShade(i);
                      setQuantity(1);
                    }}
                    aria-pressed={i === activeShade}
                    aria-label={s.is_in_stock ? s.name : `${s.name} — ${labels.stockOut}`}
                    className={`relative block rounded-full p-0.5 transition-all duration-300 ${
                      i === activeShade ? "ring-1 ring-ink" : "ring-1 ring-transparent hover:ring-ink/25"
                    } ${s.is_in_stock ? "" : "opacity-45"}`}
                  >
                    <Swatch shade={s} size={34} />
                    {/* A sold-out shade needs to read as gone without relying on
                        opacity alone, which is not a reliable signal. */}
                    {s.is_in_stock ? null : (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 m-auto block h-px w-[125%] origin-center -rotate-45 bg-ink/70"
                        style={{ top: "50%", left: "-12%" }}
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>

            {shade ? (
              <p className="mt-5 font-[family-name:var(--font-display)] text-2xl">{shade.name}</p>
            ) : null}
          </div>
        ) : null}

        {soldOut || shadeSoldOut ? (
          <p role="status" className="text-[0.6875rem] tracking-[0.16em] text-ink-muted uppercase">
            {labels.stockOut}
          </p>
        ) : lowStock ? (
          <p role="status" className="text-[0.6875rem] tracking-[0.16em] text-accent-text uppercase">
            {labels.stockLow}
          </p>
        ) : null}

        {canBuy ? (
          <div className="mt-6">
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              labels={{
                label: labels.quantity,
                decrease: labels.quantityDecrease,
                increase: labels.quantityIncrease,
                atMax: labels.quantityMax,
              }}
            />
          </div>
        ) : null}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          {purchasable ? (
            <AddToCart
              productId={productId}
              shadeId={shade?.id ?? null}
              quantity={quantity}
              label={canBuy ? labels.addToCart : labels.stockOut}
              disabled={!canBuy}
              className="w-full sm:w-auto"
            />
          ) : null}

          {shades.length > 0 ? (
            <Link
              href={`/try-on?product=${encodeURIComponent(productSlug)}${
                shade ? `&shade=${encodeURIComponent(shade.id)}` : ""
              }`}
              className={`tap inline-flex w-full items-center justify-center px-8 py-4 text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-500 ease-[var(--ease-editorial)] sm:w-auto ${
                purchasable
                  ? "border border-ink/25 hover:border-ink hover:bg-ink hover:text-canvas"
                  : "bg-ink text-canvas hover:bg-accent hover:text-ink"
              }`}
            >
              {labels.tryOnShade}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
