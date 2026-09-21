"use client";

import Link from "next/link";
import { Swatch } from "@/components/ui/swatch";
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
      <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-line px-1 pb-3">
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

      <div className="min-h-0 flex-1 overflow-y-auto pt-5">
        {activeCategory === "looks" ? (
          <ul className="space-y-5">
            {looks.map((look) => (
              <li key={look.id} className="border-b border-line-soft pb-5">
                <div className="flex items-baseline justify-between gap-4">
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
                      className="shrink-0 text-[0.625rem] tracking-[0.14em] text-ink-muted uppercase transition-colors duration-300 hover:text-accent"
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
export function AppliedChips({
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
  labels: { none: string; clear: string; intensity: string };
}) {
  if (applied.length === 0) {
    return <p className="text-xs text-ink-muted">{labels.none}</p>;
  }

  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {applied.map((item) => (
          <li
            key={item.shade.id}
            className="flex items-center gap-2 border border-line py-1.5 pr-1.5 pl-2.5"
          >
            <Swatch shade={item.shade} size={14} />
            <span className="text-[0.625rem] tracking-[0.1em] uppercase">{item.shade.name}</span>
            <button
              type="button"
              onClick={() => onRemove(item.shade.id)}
              aria-label={`Remove ${item.shade.name}`}
              className="flex h-5 w-5 items-center justify-center text-ink-muted transition-colors duration-300 hover:text-ink"
            >
              <span aria-hidden className="relative block h-2.5 w-2.5">
                <span className="absolute top-1/2 left-0 h-px w-2.5 -translate-y-1/2 rotate-45 bg-current" />
                <span className="absolute top-1/2 left-0 h-px w-2.5 -translate-y-1/2 -rotate-45 bg-current" />
              </span>
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={onClear}
            className="border border-transparent px-2.5 py-1.5 text-[0.625rem] tracking-[0.1em] text-ink-muted uppercase transition-colors duration-300 hover:text-ink"
          >
            {labels.clear}
          </button>
        </li>
      </ul>

      <div className="mt-4 space-y-3">
        {applied.map((item) => (
          <div key={item.shade.id} className="flex items-center gap-3">
            <label
              htmlFor={`intensity-${item.shade.id}`}
              className="w-28 shrink-0 truncate text-[0.625rem] tracking-[0.1em] text-ink-muted uppercase"
            >
              {item.shade.name}
            </label>
            <input
              id={`intensity-${item.shade.id}`}
              type="range"
              min={0}
              max={100}
              value={Math.round(item.intensity * 100)}
              onChange={(e) => onIntensity(item.shade.id, Number(e.target.value) / 100)}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-line accent-[var(--accent)]"
              aria-label={`${item.shade.name} ${labels.intensity}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
