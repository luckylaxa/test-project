"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Swatch } from "@/components/ui/swatch";
import { SaveHeart } from "@/components/ui/save-heart";
import { useShop } from "@/components/ui/shop-provider";
import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/cart/types";
import { gallery } from "@/lib/section-content";
import type { LookWithItems, ProductWithShades, ShadeRow } from "@/lib/content";
import type { Category } from "@/lib/try-on/makeup-renderer";
import type { Applied } from "./product-panel";

/**
 * The try-on controls on a phone.
 *
 * They float over the foot of the stage rather than sitting in a panel below
 * it. A panel — whatever height it was given — kept covering the mouth, which
 * is the part a lipstick goes on; the guessed heights that were meant to stop
 * that broke the moment the shade list got longer. Over the stage there is
 * nothing to guess: the face keeps the whole screen and the controls take a
 * strip of it.
 */
export function MobileControls({
  categories,
  activeCategory,
  onCategory,
  products,
  looks,
  applied,
  onToggleShade,
  onApplyLook,
  onClear,
  labels,
}: {
  categories: { value: Category; label: string }[];
  activeCategory: Category | "looks";
  onCategory: (value: Category | "looks") => void;
  products: ProductWithShades[];
  looks: LookWithItems[];
  applied: Applied[];
  onToggleShade: (product: ProductWithShades, shade: ShadeRow) => void;
  onApplyLook: (look: LookWithItems) => void;
  onClear: () => void;
  labels: {
    looks: string;
    addToBasket: string;
    addAll: string;
    viewProduct: string;
    clear: string;
    save: string;
    saved: string;
    empty: string;
  };
}) {
  const { checkoutEnabled, currency } = useShop();
  const { add } = useCart();
  const [focusId, setFocusId] = useState<string | null>(null);

  const showingLooks = activeCategory === "looks";

  // The focused product drives the shade row and the buy button. Default to
  // whatever is already being worn in this category, so opening a category you
  // have a shade on lands on that product rather than the first one.
  const focus = useMemo(() => {
    const worn = products.find((p) =>
      applied.some((a) => a.product.id === p.id),
    );
    return (
      products.find((p) => p.id === focusId) ?? worn ?? products[0] ?? null
    );
  }, [products, focusId, applied]);

  const focusShades = (focus?.shades ?? []).filter((s) => s.is_visible);
  const appliedHere = applied.find((a) => a.product.id === focus?.id);
  const price = focus?.price_amount ?? 0;
  const canBuy = Boolean(checkoutEnabled && focus?.is_purchasable && price > 0);
  const buyable = applied.filter(
    (a) =>
      checkoutEnabled &&
      a.product.is_purchasable &&
      (a.product.price_amount ?? 0) > 0,
  );

  const strip =
    "flex gap-2 overflow-x-auto px-[var(--gutter)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 lg:hidden">
      {/* A scrim, so small controls stay legible over any photograph. */}
      <div className="bg-gradient-to-t from-ink/80 via-ink/55 to-transparent pt-10 pb-2">
        {/* What is on the face, and the way to take it off again. */}
        {applied.length > 0 ? (
          <div className={`${strip} pointer-events-auto mb-2.5 items-center`}>
            {applied.map((item) => (
              <span
                key={item.shade.id}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-canvas/90 py-1 pr-2.5 pl-1.5 text-[0.625rem] whitespace-nowrap text-ink"
              >
                <Swatch shade={item.shade} size={14} />
                {item.product.name} · {item.shade.name}
              </span>
            ))}
            <button
              type="button"
              onClick={onClear}
              className="shrink-0 rounded-full bg-canvas/20 px-3 py-1 text-[0.5625rem] tracking-[0.14em] whitespace-nowrap text-canvas uppercase"
            >
              {labels.clear}
            </button>
          </div>
        ) : null}

        {/* Categories */}
        <div className={`${strip} pointer-events-auto mb-2`}>
          {categories.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => {
                onCategory(category.value);
                setFocusId(null);
              }}
              aria-pressed={activeCategory === category.value}
              className={`tap-sm shrink-0 rounded-full px-3 text-[0.5625rem] tracking-[0.16em] whitespace-nowrap uppercase transition-colors ${
                activeCategory === category.value
                  ? "bg-canvas text-ink"
                  : "bg-canvas/20 text-canvas"
              }`}
            >
              {category.label}
            </button>
          ))}
          {looks.length > 0 ? (
            <button
              type="button"
              onClick={() => onCategory("looks")}
              aria-pressed={showingLooks}
              className={`tap-sm shrink-0 rounded-full px-3 text-[0.5625rem] tracking-[0.16em] whitespace-nowrap uppercase transition-colors ${
                showingLooks ? "bg-canvas text-ink" : "bg-canvas/20 text-canvas"
              }`}
            >
              {labels.looks}
            </button>
          ) : null}
        </div>

        {showingLooks ? (
          <div className={`${strip} pointer-events-auto mb-2.5 pb-1`}>
            {looks.map((look) => (
              <button
                key={look.id}
                type="button"
                onClick={() => onApplyLook(look)}
                className="tap shrink-0 rounded-full bg-canvas/90 px-4 text-[0.625rem] whitespace-nowrap text-ink"
              >
                {look.name}
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* Shades of the focused product */}
            <div className={`${strip} pointer-events-auto mb-2.5 items-center`}>
              {focusShades.length === 0 ? (
                <span className="text-[0.625rem] text-canvas/80">
                  {labels.empty}
                </span>
              ) : (
                focusShades.map((shade) => {
                  const on = appliedHere?.shade.id === shade.id;
                  return (
                    <button
                      key={shade.id}
                      type="button"
                      title={shade.name}
                      onClick={() => focus && onToggleShade(focus, shade)}
                      aria-pressed={on}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all ${
                        on ? "ring-2 ring-canvas" : "ring-1 ring-canvas/30"
                      }`}
                    >
                      <Swatch shade={shade} size={28} />
                      <span className="sr-only">{shade.name}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Products in this category */}
            <div className={`${strip} pointer-events-auto mb-2.5 pb-1`}>
              {products.map((product) => {
                const image = gallery(product.gallery)[0];
                const on = product.id === focus?.id;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setFocusId(product.id)}
                    aria-pressed={on}
                    title={product.name}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-canvas transition-all ${
                      on ? "ring-2 ring-canvas" : "ring-1 ring-canvas/30"
                    }`}
                  >
                    {image ? (
                      <Image
                        src={image.url}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : null}
                    <span className="sr-only">{product.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Buy bar */}
        <div
          className="pointer-events-auto flex items-stretch gap-px bg-ink/20 px-[var(--gutter)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {showingLooks ? (
            <button
              type="button"
              disabled={buyable.length === 0}
              onClick={() =>
                buyable.forEach((a) =>
                  add({
                    productId: a.product.id,
                    shadeId: a.shade.id,
                    quantity: 1,
                  }),
                )
              }
              className="tap flex-1 justify-center bg-canvas text-[0.625rem] tracking-[0.16em] text-ink uppercase disabled:opacity-50"
            >
              {labels.addAll}
              {buyable.length > 0 ? ` (${buyable.length})` : ""}
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={!canBuy || !focus}
                onClick={() =>
                  focus &&
                  add({
                    productId: focus.id,
                    shadeId:
                      appliedHere?.shade.id ?? focusShades[0]?.id ?? null,
                    quantity: 1,
                  })
                }
                className="tap flex-1 flex-col justify-center gap-0 bg-canvas px-3 text-[0.625rem] tracking-[0.16em] text-ink uppercase disabled:opacity-50"
              >
                <span>{labels.addToBasket}</span>
                {price > 0 ? (
                  <span className="text-[0.5625rem] tracking-[0.1em] text-ink-muted normal-case">
                    {formatMoney(price, currency)}
                  </span>
                ) : null}
              </button>
              {focus ? (
                <>
                  <Link
                    href={`/products/${focus.slug}`}
                    className="tap flex-1 justify-center bg-canvas/15 text-[0.625rem] tracking-[0.16em] text-canvas uppercase"
                  >
                    {labels.viewProduct}
                  </Link>
                  <span className="flex items-center bg-canvas/15 px-1 text-canvas">
                    <SaveHeart
                      productId={focus.id}
                      labels={{ add: labels.save, remove: labels.saved }}
                    />
                  </span>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
