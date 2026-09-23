"use client";

import { MAX_QUANTITY } from "@/lib/cart/types";

/**
 * How many of one item to add.
 *
 * The cap is the same one the basket and the server enforce. Hitting it used to
 * do nothing at all — the button simply stopped responding, which reads as a
 * broken control rather than as a limit — so the reason is spelled out.
 */
export function QuantityStepper({
  value,
  onChange,
  labels,
}: {
  value: number;
  onChange: (next: number) => void;
  labels: { label: string; decrease: string; increase: string; atMax: string };
}) {
  const atMax = value >= MAX_QUANTITY;

  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="eyebrow">{labels.label}</span>
        <span className="flex items-center border border-line-strong">
          <button
            type="button"
            aria-label={labels.decrease}
            disabled={value <= 1}
            onClick={() => onChange(Math.max(1, value - 1))}
            className="tap-sm justify-center px-3 text-sm transition-colors hover:text-accent-text disabled:opacity-35"
          >
            −
          </button>
          <span aria-live="polite" className="min-w-8 text-center text-sm tabular-nums">
            {value}
          </span>
          <button
            type="button"
            aria-label={labels.increase}
            disabled={atMax}
            onClick={() => onChange(Math.min(MAX_QUANTITY, value + 1))}
            className="tap-sm justify-center px-3 text-sm transition-colors hover:text-accent-text disabled:opacity-35"
          >
            +
          </button>
        </span>
      </div>
      {atMax ? <p className="mt-2 text-xs text-ink-muted">{labels.atMax}</p> : null}
    </div>
  );
}
