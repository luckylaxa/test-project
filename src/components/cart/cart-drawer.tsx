"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./cart-provider";
import { createCheckout, verifyPayment } from "@/lib/cart/checkout";
import { loadRazorpay, payWithRazorpay } from "@/lib/cart/razorpay";
import { formatMoney, type CartLineView } from "@/lib/cart/types";

export type CartLabels = {
  title: string;
  empty: string;
  subtotal: string;
  checkout: string;
  continue: string;
  remove: string;
  close: string;
  note: string | null;
  unavailable: string;
  paymentUnavailable: string;
  paymentUnverified: string;
};

/**
 * The basket, as a panel over the page.
 *
 * Line details are resolved from a snapshot passed in by the server, so the
 * drawer can show names and prices without the browser being the source of
 * truth for either.
 */
export function CartDrawer({
  catalogue,
  currency,
  labels,
}: {
  catalogue: Record<string, CartLineView>;
  currency: string;
  labels: CartLabels;
}) {
  const router = useRouter();
  const { lines, open, setOpen, setQuantity, remove } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escape closes, and the page behind should not scroll.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  const key = (productId: string, shadeId: string | null) => `${productId}:${shadeId ?? ""}`;

  const resolved = lines.map((line) => ({
    line,
    view: catalogue[key(line.productId, line.shadeId)] ?? null,
  }));

  const subtotal = resolved.reduce(
    (sum, r) => sum + (r.view?.available ? r.view.unitAmount * r.line.quantity : 0),
    0,
  );
  const hasUnavailable = resolved.some((r) => !r.view?.available);

  async function checkout() {
    setBusy(true);
    setError(null);
    const result = await createCheckout(lines);

    if (!result.ok) {
      // Being signed out or having no address is not an error to read and
      // shrug at — it is a next step, so take them straight to it.
      if (result.needs) {
        setOpen(false);
        router.push(`/account?reason=${result.needs === "sign-in" ? "checkout" : "address"}`);
        return;
      }
      setError(result.error);
      setBusy(false);
      return;
    }

    if ("demoUrl" in result) {
      setOpen(false);
      router.push(result.demoUrl);
      return;
    }

    try {
      const Razorpay = await loadRazorpay();
      const paid = await payWithRazorpay(result.order, Razorpay);

      // Closing the modal is not a failure. Leave the basket exactly as it
      // was so they can pick it up again.
      if (!paid) {
        setBusy(false);
        return;
      }

      // The browser saying "paid" proves nothing; the server checks the
      // signature before we show anyone a confirmation.
      const verified = await verifyPayment({
        orderId: paid.razorpay_order_id,
        paymentId: paid.razorpay_payment_id,
        signature: paid.razorpay_signature,
      });

      if (!verified.ok) {
        setError(labels.paymentUnverified);
        setBusy(false);
        return;
      }

      setOpen(false);
      router.push("/checkout/complete");
    } catch {
      setError(labels.paymentUnavailable);
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label={labels.close}
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-ink/35"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={labels.title}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-canvas shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl">{labels.title}</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[0.625rem] tracking-[0.16em] text-ink-muted uppercase transition-colors hover:text-ink"
          >
            {labels.close}
          </button>
        </header>

        {resolved.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <p className="text-sm text-ink-muted">{labels.empty}</p>
          </div>
        ) : (
          <ul className="min-h-0 flex-1 divide-y divide-line-soft overflow-y-auto px-6">
            {resolved.map(({ line, view }) => (
              <li key={key(line.productId, line.shadeId)} className="flex gap-4 py-5">
                <span className="relative h-20 w-16 shrink-0 overflow-hidden bg-canvas-soft">
                  {view?.image ? (
                    <Image
                      src={view.image}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                      unoptimized={view.image.endsWith(".svg")}
                    />
                  ) : null}
                </span>

                <div className="min-w-0 flex-1">
                  {view ? (
                    <Link
                      href={`/products/${view.productSlug}`}
                      onClick={() => setOpen(false)}
                      className="block truncate text-sm transition-colors hover:text-accent"
                    >
                      {view.productName}
                    </Link>
                  ) : (
                    <p className="truncate text-sm text-ink-muted">{labels.unavailable}</p>
                  )}

                  {view?.shadeName ? (
                    <p className="mt-0.5 flex items-center gap-1.5 text-[0.625rem] tracking-[0.12em] text-ink-muted uppercase">
                      {view.shadeHex ? (
                        <span
                          aria-hidden
                          className="h-3 w-3 rounded-full ring-1 ring-ink/10"
                          style={{ background: view.shadeHex }}
                        />
                      ) : null}
                      {view.shadeName}
                    </p>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="flex items-center border border-line">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity(line, line.quantity - 1)}
                        className="px-2.5 py-1 text-sm transition-colors hover:text-accent"
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-xs tabular-nums">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQuantity(line, line.quantity + 1)}
                        className="px-2.5 py-1 text-sm transition-colors hover:text-accent"
                      >
                        +
                      </button>
                    </span>

                    {view?.available ? (
                      <span className="text-sm tabular-nums">
                        {formatMoney(view.unitAmount * line.quantity, currency)}
                      </span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(line)}
                    className="mt-2 text-[0.625rem] tracking-[0.14em] text-ink-muted uppercase transition-colors hover:text-ink"
                  >
                    {labels.remove}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {resolved.length > 0 ? (
          <footer className="border-t border-line px-6 py-5">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">{labels.subtotal}</span>
              <span className="font-[family-name:var(--font-display)] text-2xl tabular-nums">
                {formatMoney(subtotal, currency)}
              </span>
            </div>

            {error ? (
              <p role="alert" className="mt-3 text-sm text-ink-soft">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={checkout}
              disabled={busy || hasUnavailable}
              className="mt-4 w-full bg-ink px-6 py-4 text-[0.6875rem] tracking-[0.2em] text-canvas uppercase transition-colors duration-500 hover:bg-accent hover:text-ink disabled:opacity-40"
            >
              {busy ? "…" : labels.checkout}
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 w-full text-[0.625rem] tracking-[0.16em] text-ink-muted uppercase transition-colors hover:text-ink"
            >
              {labels.continue}
            </button>

            {labels.note ? <p className="mt-4 text-xs text-ink-muted">{labels.note}</p> : null}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

/** The basket button in the header. */
export function CartButton({ label }: { label: string }) {
  const { count, setOpen } = useCart();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-300 hover:text-accent"
    >
      {label}
      {count > 0 ? <span className="tabular-nums"> ({count})</span> : null}
    </button>
  );
}
