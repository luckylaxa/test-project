"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ui/cards";
import { isSoldOut } from "@/lib/cart/sellable";
import type { ProductWithShades } from "@/lib/content";

export type BrowserLabels = {
  searchLabel: string;
  searchPlaceholder: string;
  searchClear: string;
  resultsFor: string;
  noResults: string;
  sortLabel: string;
  sortFeatured: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  sortNameAsc: string;
  countOne: string;
  countMany: string;
  all: string;
  category: string;
  finish: string;
  clearFilters: string;
  empty: string;
};

type Option = { value: string; label: string };
type Sort = "featured" | "price-asc" | "price-desc" | "name-asc";

const SORTS: Sort[] = ["featured", "price-asc", "price-desc", "name-asc"];

/**
 * Browse, search and sort the whole catalogue.
 *
 * Filtering runs in the browser on a catalogue the server already embedded.
 * That keeps `/products` prerendered and makes every keystroke instant, which is
 * the right trade at this size — a shop with thousands of products would move
 * this to a query, and lose the prerender for it.
 *
 * Every control writes to the URL, so a filtered or searched view can be
 * shared, bookmarked and reached with the back button. The collection filters
 * used to hold this in component state only: reload, or press back, and the
 * view someone had built silently reset.
 */
export function ProductBrowser({
  products,
  categoryOptions,
  finishOptions,
  labels,
}: {
  products: ProductWithShades[];
  categoryOptions: Option[];
  finishOptions: Option[];
  labels: BrowserLabels;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const query = params.get("q") ?? "";
  const category = params.get("category");
  const finish = params.get("finish");
  const sortParam = params.get("sort");
  const sort: Sort = SORTS.includes(sortParam as Sort) ? (sortParam as Sort) : "featured";

  // The field is typed into far faster than a URL should be rewritten, so it
  // keeps its own value and pushes to the address bar on a short delay.
  const [draft, setDraft] = useState(query);

  // When the URL's own `q` changes from outside this field — the back button,
  // "Clear filters", a shared link — the field has to follow. Adjusted during
  // render rather than in an effect: an effect would render once with the stale
  // value and then again with the new one.
  const [syncedQuery, setSyncedQuery] = useState(query);
  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setDraft(query);
  }

  /*
   * `push` for a discrete choice, `replace` while typing.
   *
   * Everything replaced at first, which left no history at all: pressing back
   * after narrowing the grid took you off the page entirely instead of undoing
   * the filter. Pushing every keystroke is the opposite mistake — it buries the
   * previous page under one entry per character.
   */
  const setParams = useCallback(
    (changes: Record<string, string | null>, mode: "push" | "replace" = "push") => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      next.delete("focus");
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (mode === "push") router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [params, pathname, router],
  );

  useEffect(() => {
    if (draft === query) return;
    const timer = setTimeout(() => setParams({ q: draft || null }, "replace"), 250);
    return () => clearTimeout(timer);
  }, [draft, query, setParams]);

  // The header's Search link lands here with `?focus=search`, so the field is
  // ready to type into. Read from the URL rather than a prop, because a server
  // page that awaits searchParams cannot be prerendered.
  const wantsFocus = params.get("focus") === "search";
  useEffect(() => {
    if (wantsFocus) searchRef.current?.focus();
  }, [wantsFocus]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const terms = needle.split(/\s+/).filter(Boolean);

    const matches = (product: ProductWithShades) => {
      if (terms.length === 0) return true;
      // Searching a cosmetics catalogue means searching shade names too:
      // "rouge maison" is a shade, not a product.
      const haystack = [
        product.name,
        product.short_description ?? "",
        product.category,
        ...(product.shades ?? []).filter((s) => s.is_visible).map((s) => `${s.name} ${s.finish}`),
      ]
        .join(" ")
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    };

    const filtered = products.filter((product) => {
      if (!matches(product)) return false;
      if (category && product.category !== category) return false;
      if (finish && !(product.shades ?? []).some((s) => s.is_visible && s.finish === finish)) {
        return false;
      }
      return true;
    });

    const price = (p: ProductWithShades) => p.price_amount ?? 0;
    const sorted = [...filtered];
    if (sort === "price-asc") sorted.sort((a, b) => price(a) - price(b));
    else if (sort === "price-desc") sorted.sort((a, b) => price(b) - price(a));
    else if (sort === "name-asc") sorted.sort((a, b) => a.name.localeCompare(b.name));

    // Whatever the order, what you cannot buy goes last. A sold-out product at
    // the top of a grid is the single most annoying thing a shop can do.
    return sorted.sort((a, b) => {
      const aGone = isSoldOut(a, (a.shades ?? []).filter((s) => s.is_visible));
      const bGone = isSoldOut(b, (b.shades ?? []).filter((s) => s.is_visible));
      return Number(aGone) - Number(bGone);
    });
  }, [products, query, category, finish, sort]);

  const hasFilters = Boolean(query || category || finish || sortParam);

  const countText =
    results.length === 1
      ? labels.countOne
      : labels.countMany.replace("{count}", String(results.length));

  const row = (
    legend: string,
    options: Option[],
    active: string | null,
    key: "category" | "finish",
  ) =>
    options.length > 0 ? (
      <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <legend className="sr-only">{legend}</legend>
        <span aria-hidden className="eyebrow">
          {legend}
        </span>
        <button
          type="button"
          aria-pressed={active === null}
          onClick={() => setParams({ [key]: null })}
          // min-w: "All" is only 23px wide, a pixel under the 24px WCAG target.
          className={`tap-sm min-w-6 justify-center text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 ${
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
            onClick={() => setParams({ [key]: active === option.value ? null : option.value })}
            className={`tap-sm text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 ${
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
      {/* Search */}
      <div className="border-b border-line pb-6">
        <label htmlFor="product-search" className="eyebrow block">
          {labels.searchLabel}
        </label>
        <div className="mt-3 flex items-center gap-3 border-b border-line-strong focus-within:border-ink">
          <input
            ref={searchRef}
            id="product-search"
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={labels.searchPlaceholder}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-3 text-base placeholder:text-ink-muted/70 placeholder:italic focus:outline-none"
          />
          {draft ? (
            <button
              type="button"
              onClick={() => {
                setDraft("");
                setParams({ q: null }, "replace");
                searchRef.current?.focus();
              }}
              className="tap-sm shrink-0 text-[0.625rem] tracking-[0.16em] text-ink-muted uppercase transition-colors hover:text-ink"
            >
              {labels.searchClear}
            </button>
          ) : null}
        </div>
      </div>

      {/* Filters and sort */}
      <div className="flex flex-col gap-4 border-b border-line py-6">
        {row(labels.category, categoryOptions, category, "category")}
        {row(labels.finish, finishOptions, finish, "finish")}

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <label htmlFor="product-sort" className="eyebrow">
              {labels.sortLabel}
            </label>
            <select
              id="product-sort"
              value={sort}
              onChange={(e) => setParams({ sort: e.target.value === "featured" ? null : e.target.value })}
              className="tap-sm border border-line-strong bg-transparent px-2 text-[0.6875rem] tracking-[0.12em] uppercase focus:border-ink focus:outline-none"
            >
              <option value="featured">{labels.sortFeatured}</option>
              <option value="price-asc">{labels.sortPriceAsc}</option>
              <option value="price-desc">{labels.sortPriceDesc}</option>
              <option value="name-asc">{labels.sortNameAsc}</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p aria-live="polite" className="text-[0.6875rem] tracking-[0.12em] text-ink-muted uppercase">
              {query ? `${labels.resultsFor} “${query}” · ` : ""}
              {countText}
            </p>
            {hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setDraft("");
                  setParams({ q: null, category: null, finish: null, sort: null });
                }}
                className="tap-sm text-[0.625rem] tracking-[0.16em] text-ink-muted uppercase transition-colors hover:text-ink"
              >
                {labels.clearFilters}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {results.length > 0 ? (
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4 lg:gap-x-10">
          {results.map((product, i) => (
            <ProductCard key={product.id} product={product} delay={i * 60} headingLevel={2} />
          ))}
        </div>
      ) : (
        <p className="mt-14 text-sm text-ink-muted">
          {query ? labels.noResults : products.length === 0 ? labels.empty : labels.noResults}
        </p>
      )}
    </>
  );
}
