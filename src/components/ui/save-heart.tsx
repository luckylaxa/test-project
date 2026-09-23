"use client";

import { useSaved } from "./saved-provider";

/**
 * Icon-only save control, for use over a card image.
 *
 * The labelled `SaveButton` is for a product page, where there is room for a
 * word. Here the accessible name carries it instead.
 */
export function SaveHeart({
  productId,
  labels,
  className = "",
}: {
  productId: string;
  labels: { add: string; remove: string };
  className?: string;
}) {
  const { isSaved, toggle, busy } = useSaved();
  const saved = isSaved(productId);

  return (
    <button
      type="button"
      // The card is a link; without this the click would follow it.
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggle(productId);
      }}
      disabled={busy.has(productId)}
      aria-pressed={saved}
      aria-label={saved ? labels.remove : labels.add}
      title={saved ? labels.remove : labels.add}
      className={`inline-flex h-11 w-11 items-center justify-center text-ink transition-opacity duration-300 disabled:opacity-50 ${className}`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas/85 backdrop-blur-[2px] transition-colors duration-300 hover:bg-canvas">
        <svg
          aria-hidden
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M12 21s-7.5-4.6-9.4-9A5.3 5.3 0 0 1 12 6.6 5.3 5.3 0 0 1 21.4 12c-1.9 4.4-9.4 9-9.4 9z" />
        </svg>
      </span>
    </button>
  );
}
