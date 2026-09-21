"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ui/cards";
import type { ProductWithShades } from "@/lib/content";

type Option = { value: string; label: string };

/**
 * Category and finish filters for a collection.
 * Options are derived from the products actually present, so an empty category
 * never shows up as a dead filter.
 */
export function ProductFilters({
  products,
  categoryOptions,
  finishOptions,
  labels,
}: {
  products: ProductWithShades[];
  categoryOptions: Option[];
  finishOptions: Option[];
  labels: { all: string; category: string; finish: string; empty: string };
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [finish, setFinish] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      products.filter((product) => {
        if (category && product.category !== category) return false;
        if (finish && !(product.shades ?? []).some((s) => s.is_visible && s.finish === finish)) {
          return false;
        }
        return true;
      }),
    [products, category, finish],
  );

  const row = (
    legend: string,
    options: Option[],
    active: string | null,
    setActive: (v: string | null) => void,
  ) =>
    options.length > 0 ? (
      <fieldset className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <legend className="sr-only">{legend}</legend>
        <span aria-hidden className="eyebrow">
          {legend}
        </span>
        <button
          type="button"
          aria-pressed={active === null}
          onClick={() => setActive(null)}
          className={`text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 ${
            active === null ? "text-ink" : "text-ink-muted hover:text-ink"
          }`}
        >
          {labels.all}
        </button>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={active === option.value}
            onClick={() => setActive(active === option.value ? null : option.value)}
            className={`text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 ${
              active === option.value ? "text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </fieldset>
    ) : null;

  return (
    <>
      <div className="flex flex-col gap-4 border-y border-line py-6">
        {row(labels.category, categoryOptions, category, setCategory)}
        {row(labels.finish, finishOptions, finish, setFinish)}
      </div>

      {filtered.length > 0 ? (
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4 lg:gap-x-10">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} delay={i * 70} headingLevel={2} />
          ))}
        </div>
      ) : (
        <p className="mt-14 text-sm text-ink-muted">{labels.empty}</p>
      )}
    </>
  );
}
