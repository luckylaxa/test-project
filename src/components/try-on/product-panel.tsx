"use client";

import Link from "next/link";
import { Swatch } from "@/components/ui/swatch";
import { SaveHeart } from "@/components/ui/save-heart";
import { useShop } from "@/components/ui/shop-provider";
import { canSell } from "@/lib/cart/sellable";
import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/cart/types";
import type { LookWithItems, ProductWithShades, ShadeRow } from "@/lib/content";
import type { Category } from "@/lib/try-on/makeup-renderer";

export type Applied = {
  shade: ShadeRow;
  product: ProductWithShades;
  intensity: number;
};

/** Browse by category, then product, then shade. */
export function ProductPanel({
  categories,
  activeCategory,
  onCategory,
  products,
  looks,
  applied,
  onToggleShade,
  onApplyLook,
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
  labels: { looks: string; viewProduct: string; tryLook: string; empty: string };
}) {
  const appliedIds = new Set(applied.map((a) => a.shade.id));

  return (
    <div className="flex h-full flex-col">
      {/* Category tabs */}
      <div className="flex shrink-0 flex-wrap gap-x-1 gap-y-1 border-b border-line pb-3">
        {categories.map((category) => (
          <button
            key={category.value}
            type="button"
            onClick={() => onCategory(category.value)}
            aria-pressed={activeCategory === category.value}
            className={`shrink-0 px-3 py-1.5 text-[0.625rem] tracking-[0.16em] uppercase transition-colors duration-300 ${
              activeCategory === category.value ? "text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {category.label}
          </button>
        ))}
        {looks.length > 0 ? (
          <button
            type="button"
            onClick={() => onCategory("looks")}
            aria-pressed={activeCategory === "looks"}
            className={`shrink-0 px-3 py-1.5 text-[0.625rem] tracking-[0.16em] uppercase transition-colors duration-300 ${
              activeCategory === "looks" ? "text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {labels.looks}
          </button>
        ) : null}
      </div>

      {/* The fade marks the scroll boundary. Without it the list simply stops
          mid-glyph against the shelf below, which reads as a rendering fault
          rather than as "there is more below" — most visible on a phone, where
          the sheet leaves this list only a few rows tall. */}
      <div
        className="min-h-0 flex-1 overflow-y-auto pt-5"
        style={{
          maskImage: "linear-gradient(to bottom, #000 calc(100% - 2rem), transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 calc(100% - 2rem), transparent)",
        }}
      >
        {activeCategory === "looks" ? (
          <ul className="space-y-5">
            {looks.map((look) => (
              <li key={look.id} className="border-b border-line-soft pb-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-[family-name:var(--font-display)] text-xl">{look.name}</h3>
                  <button
                    type="button"
                    onClick={() => onApplyLook(look)}
                    className="shrink-0 border border-ink/25 px-4 py-1.5 text-[0.625rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-canvas"
                  >
                    {labels.tryLook}
                  </button>
                </div>
                {look.items.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {look.items.map((item) => (
                      <li key={item.id}>
                        <Swatch shade={item.shade} size={16} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : products.length === 0 ? (
          <p className="text-sm text-ink-muted">{labels.empty}</p>
        ) : (
          <ul className="space-y-7">
            {products.map((product) => {
              const shades = (product.shades ?? []).filter((s) => s.is_visible);
              if (shades.length === 0) return null;
              return (
                <li key={product.id}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-[family-name:var(--font-display)] text-xl leading-tight">
                      {product.name}
                    </h3>
                    <Link
                      href={`/products/${product.slug}`}
                      className="tap-sm shrink-0 text-[0.625rem] tracking-[0.14em] text-ink-muted uppercase transition-colors duration-300 hover:text-accent-text"
                    >
                      {labels.viewProduct}
                    </Link>
                  </div>

                  <ul className="mt-4 flex flex-wrap gap-2.5">
                    {shades.map((shade) => {
                      const isOn = appliedIds.has(shade.id);
                      return (
                        <li key={shade.id}>
                          <button
                            type="button"
                            onClick={() => onToggleShade(product, shade)}
                            aria-pressed={isOn}
                            title={shade.name}
                            className={`block rounded-full p-0.5 transition-all duration-300 ${
                              isOn ? "ring-1 ring-ink" : "ring-1 ring-transparent hover:ring-ink/30"
                            }`}
                          >
                            <Swatch shade={shade} size={30} />
                            <span className="sr-only">{shade.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Applied products as removable chips, each with its own intensity slider. */
/**
 * What is on the face right now — and the one place a try-on turns into a sale.
 *
 * The studio used to end at "View product", which sent someone who had just
 * found their shade away to a page where they had to find it again. Each row
 * now carries its own price, Add to basket and save, and a whole applied look
 * goes in with one button.
 *
 * Each applied shade is one row. It used to be two lists — a chip list and a
 * separate slider list — naming every shade twice.
 */
export function WearingNow({
  applied,
  onRemove,
  onIntensity,
  onClear,
  labels,
}: {
  applied: Applied[];
  onRemove: (shadeId: string) => void;
  onIntensity: (shadeId: string, value: number) => void;
  onClear: () => void;
  labels: {
    none: string;
    clear: string;
    intensity: string;
    title: string;
    add: string;
    addAll: string;
    save: string;
    saved: string;
  };
}) {
  const { checkoutEnabled, currency } = useShop();
  const { add } = useCart();

  if (applied.length === 0) {
    return <p className="text-xs text-ink-muted">{labels.none}</p>;
  }

  const buyable = applied.filter((a) =>
    canSell({ checkoutEnabled, product: a.product, shade: a.shade }),
  );

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h3 className="text-[0.625rem] tracking-[0.16em] text-ink-muted uppercase">
          {labels.title}
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 text-[0.625rem] tracking-[0.14em] text-ink-muted uppercase transition-colors duration-300 hover:text-ink"
        >
          {labels.clear}
        </button>
      </div>

      <ul className="space-y-4">
        {applied.map((item) => {
          const price = item.product.price_amount ?? 0;
          const canBuy = canSell({ checkoutEnabled, product: item.product, shade: item.shade });
          return (
            <li key={item.shade.id} className="border-b border-line-soft pb-4 last:border-0">
              <div className="flex items-center gap-2.5">
                <Swatch shade={item.shade} size={18} />
                <span className="min-w-0 flex-1 truncate text-[0.6875rem] leading-tight">
                  <span className="text-ink">{item.product.name}</span>
                  <span className="text-ink-muted"> · {item.shade.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(item.shade.id)}
                  aria-label={`Remove ${item.shade.name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-muted transition-colors duration-300 hover:text-ink"
                >
                  <span aria-hidden className="relative block h-2.5 w-2.5">
                    <span className="absolute top-1/2 left-0 h-px w-2.5 -translate-y-1/2 rotate-45 bg-current" />
                    <span className="absolute top-1/2 left-0 h-px w-2.5 -translate-y-1/2 -rotate-45 bg-current" />
                  </span>
                </button>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(item.intensity * 100)}
                onChange={(e) => onIntensity(item.shade.id, Number(e.target.value) / 100)}
                className="mt-2.5 h-1 w-full cursor-pointer appearance-none rounded-full bg-line accent-[var(--accent)]"
                aria-label={`${item.product.name} ${item.shade.name} ${labels.intensity}`}
              />

              <div className="mt-3 flex items-center gap-2">
                {price > 0 ? (
                  <span className="text-[0.6875rem] tracking-[0.12em] text-ink-muted">
                    {formatMoney(price, currency)}
                  </span>
                ) : null}
                {canBuy ? (
                  <button
                    type="button"
                    onClick={() => add({ productId: item.product.id, shadeId: item.shade.id, quantity: 1 })}
                    className="tap ml-auto justify-center border border-ink/25 px-3 text-[0.5625rem] tracking-[0.16em] uppercase transition-colors duration-500 ease-[var(--ease-editorial)] hover:border-ink hover:bg-ink hover:text-canvas"
                  >
                    {labels.add}
                  </button>
                ) : (
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="tap ml-auto justify-center border border-ink/25 px-3 text-[0.5625rem] tracking-[0.16em] uppercase transition-colors duration-500 hover:border-ink"
                  >
                    {labels.add}
                  </Link>
                )}
                <SaveHeart
                  productId={item.product.id}
                  labels={{ add: labels.save, remove: labels.saved }}
                  className="shrink-0"
                />
              </div>
            </li>
          );
        })}
      </ul>

      {buyable.length > 1 ? (
        <button
          type="button"
          onClick={() =>
            buyable.forEach((a) =>
              add({ productId: a.product.id, shadeId: a.shade.id, quantity: 1 }),
            )
          }
          className="tap mt-4 w-full justify-center bg-ink px-4 text-[0.625rem] tracking-[0.18em] text-canvas uppercase transition-colors duration-500 ease-[var(--ease-editorial)] hover:bg-accent hover:text-ink"
        >
          {labels.addAll} ({buyable.length})
        </button>
      ) : null}
    </div>
  );
}
