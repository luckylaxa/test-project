"use client";

import { useCart } from "./cart-provider";

/** Adds the currently selected shade to the basket. */
export function AddToCart({
  productId,
  shadeId,
  label,
  quantity = 1,
  disabled = false,
  className = "",
}: {
  productId: string;
  shadeId: string | null;
  label: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
}) {
  const { add } = useCart();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => add({ productId, shadeId, quantity })}
      className={`tap inline-flex items-center justify-center bg-ink px-8 py-4 text-[0.6875rem] tracking-[0.2em] text-canvas uppercase transition-colors duration-500 ease-[var(--ease-editorial)] hover:bg-accent hover:text-ink disabled:opacity-40 ${className}`}
    >
      {label}
    </button>
  );
}
