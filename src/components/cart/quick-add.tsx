"use client";

import { useState } from "react";
import { Swatch } from "@/components/ui/swatch";
import type { ShadeRow } from "@/lib/content";
import { useCart } from "./cart-provider";

/**
 * Add to basket straight from a card.
 *
 * A product with more than one shade cannot be added blind — picking the first
 * one for someone is how you get a returned lipstick — so the button opens a
 * shade chooser in place. One shade, or none, adds immediately.
 */
export function QuickAdd({
  productId,
  shades,
  labels,
}: {
  productId: string;
  shades: ShadeRow[];
  labels: { add: string; chooseShade: string; close: string };
}) {
  const { add } = useCart();
  const [choosing, setChoosing] = useState(false);

  function stop(event: React.MouseEvent) {
    // These controls sit inside the card's link.
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    // The chooser floats over the card instead of growing it. Grown, it
    // stretched its whole grid row, and the card beside it opened a ~240px gap
    // between its price and its button.
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          if (shades.length > 1) setChoosing((v) => !v);
          else add({ productId, shadeId: shades[0]?.id ?? null, quantity: 1 });
        }}
        aria-expanded={shades.length > 1 ? choosing : undefined}
        className="tap w-full justify-center border border-ink/25 px-4 text-[0.625rem] tracking-[0.18em] uppercase transition-colors duration-500 ease-[var(--ease-editorial)] hover:border-ink hover:bg-ink hover:text-canvas"
      >
        {labels.add}
      </button>

      {choosing ? (
      <div onClick={stop} className="absolute inset-x-0 bottom-0 z-20 border border-line-strong bg-canvas p-3 shadow-[0_-6px_24px_rgba(11,11,11,0.10)]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[0.5625rem] tracking-[0.14em] text-ink-muted uppercase">
            {labels.chooseShade}
          </span>
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              setChoosing(false);
            }}
            className="shrink-0 text-[0.5625rem] tracking-[0.14em] text-ink-muted uppercase hover:text-ink"
          >
            {labels.close}
          </button>
        </div>
        <ul className="flex flex-wrap gap-2">
          {shades.map((shade) => (
            <li key={shade.id}>
              <button
                type="button"
                title={shade.name}
                onClick={(e) => {
                  stop(e);
                  add({ productId, shadeId: shade.id, quantity: 1 });
                  setChoosing(false);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-transparent transition-all duration-300 hover:ring-ink/40"
              >
                <Swatch shade={shade} size={24} />
                <span className="sr-only">{shade.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      ) : null}
    </div>
  );
}
