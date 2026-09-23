"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "./cart-provider";
import { createCheckout, verifyPayment, type CheckoutErrorKey } from "@/lib/cart/checkout";
import { loadRazorpay, payWithRazorpay } from "@/lib/cart/razorpay";
import { formatMoney, type CartLineView } from "@/lib/cart/types";

/** Marks a return from the sign-in gate, so the checkout can carry on. */
const RESUME = "resume-checkout";

export type CartLabels = {
  title: string;
  empty: string;
  emptyShop: string;
  emptyTryOn: string;
  emptySaved: string;
  subtotal: string;
  checkout: string;
  checkoutBusy: string;
  continue: string;
  remove: string;
  close: string;
  note: string | null;
  unavailable: string;
  unavailableNote: string;
  paymentUnavailable: string;
  paymentUnverified: string;
  /** Every refusal `createCheckout` can return, already resolved to wording. */
  checkoutErrors: Record<CheckoutErrorKey, string>;
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
  const pathname = usePathname();
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

  const key = (productId: string, shadeId: string | null) =>
    `${productId}:${shadeId ?? ""}`;

  const resolved = lines.map((line) => ({
    line,
    view: catalogue[key(line.productId, line.shadeId)] ?? null,
  }));

  const subtotal = resolved.reduce(
    (sum, r) =>
      sum + (r.view?.available ? r.view.unitAmount * r.line.quantity : 0),
    0,
  );
  const hasUnavailable = resolved.some((r) => !r.view?.available);

  // A ref, not the `busy` state: state is not readable by a second call made
  // in the same tick, and both a click and the resume effect below can start
  // one. Two runs would create two Razorpay orders for one basket.
  const running = useRef(false);

  const checkout = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError(null);

    try {
      const result = await createCheckout(lines);

      if (!result.ok) {
        // Being signed out or having no address is not an error to read and
        // shrug at — it is a next step, so take them straight to it.
        if (result.needs) {
          setOpen(false);
          // Come back and *finish buying*, not just land on the page they
          // happened to be reading. The basket is a drawer over whatever page
          // you are on, so sending back the bare pathname returned people to the
          // home page with the basket shut and the checkout abandoned — which is
          // exactly what it looked like: sign in, and nothing happens.
          const url = new URL(window.location.href);
          url.searchParams.set(RESUME, "1");
          const back = encodeURIComponent(url.pathname + url.search);
          router.push(
            `/account?reason=${result.needs === "sign-in" ? "checkout" : "address"}&next=${back}`,
          );
          return;
        }
        setError(labels.checkoutErrors[result.errorKey]);
        return;
      }

      if ("demoUrl" in result) {
        setOpen(false);
        router.push(result.demoUrl);
        return;
      }

      const Razorpay = await loadRazorpay();
      const paid = await payWithRazorpay(result.order, Razorpay);

      // Closing the modal is not a failure. Leave the basket exactly as it
      // was so they can pick it up again.
      if (!paid) return;

      // The browser saying "paid" proves nothing; the server checks the
      // signature before we show anyone a confirmation.
      const verified = await verifyPayment({
        orderId: paid.razorpay_order_id,
        paymentId: paid.razorpay_payment_id,
        signature: paid.razorpay_signature,
      });

      if (!verified.ok) {
        setError(labels.paymentUnverified);
        return;
      }

      setOpen(false);
      router.push("/checkout/complete");
    } catch {
      setError(labels.paymentUnavailable);
    } finally {
      // Every path clears it, including the ones that navigate away.
      //
      // This drawer lives in the layout and never unmounts, so `busy` left
      // true is a button that is dead for the rest of the visit. That is what
      // "not active sometimes" was: the sign-in gate returned early without
      // clearing it, so anyone who opened the basket again — after signing in,
      // or just by going back — found a faded button reading "…" and no way
      // to buy anything.
      running.current = false;
      setBusy(false);
    }
  }, [lines, router, setOpen, labels.checkoutErrors, labels.paymentUnavailable, labels.paymentUnverified]);

  // Coming back from the sign-in (or the address form) the checkout picks up
  // where it left off: the basket reopens and the payment carries on.
  //
  // Keyed on `pathname`, because this drawer lives in the layout and so never
  // remounts across a client-side navigation — a mount-only effect ran on
  // /account, where there is no marker, and never again. Read from `location`
  // rather than `useSearchParams` so the prerendered pages this sits on do not
  // have to become dynamic.
  //
  // Stripping the marker before starting is the whole guard against firing
  // twice. A `useRef` latch used to be, and it was wrong for the same reason
  // the mount-only effect was: the drawer never unmounts, so a latch set on
  // the first return stayed set for the rest of the visit, and the second leg
  // of the gate — sign in, and *then* add an address — never resumed at all.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(RESUME) !== "1") return;
    url.searchParams.delete(RESUME);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    /* Reopening the basket and running the checkout IS the synchronisation this
       effect exists for: the marker in the URL is the external state, and there
       is no render-time equivalent of "carry on buying". */
    setOpen(true);
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void checkout();
  }, [checkout, setOpen, pathname]);

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
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            {labels.title}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[0.625rem] tracking-[0.16em] text-ink-muted uppercase transition-colors hover:text-ink"
          >
            {labels.close}
          </button>
        </header>

        {resolved.length === 0 ? (
          /* An empty basket used to be a dead end: the footer is hidden when
             there is nothing in it, so the only control on the whole panel was
             Close. Somewhere to go next is the point of an empty state. */
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <p className="text-sm text-ink-muted">{labels.empty}</p>
            <div className="flex w-full max-w-xs flex-col gap-3">
              <Link
                href="/collections"
                onClick={() => setOpen(false)}
                className="tap justify-center bg-ink px-6 text-[0.6875rem] tracking-[0.2em] text-canvas uppercase transition-colors duration-500 hover:bg-accent hover:text-ink"
              >
                {labels.emptyShop}
              </Link>
              <Link
                href="/try-on"
                onClick={() => setOpen(false)}
                className="tap justify-center border border-line-strong px-6 text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-300 hover:border-ink"
              >
                {labels.emptyTryOn}
              </Link>
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="tap justify-center text-[0.625rem] tracking-[0.16em] text-ink-muted uppercase transition-colors hover:text-ink"
              >
                {labels.emptySaved}
              </Link>
            </div>
          </div>
        ) : (
          <ul className="min-h-0 flex-1 divide-y divide-line-soft overflow-y-auto px-6">
            {resolved.map(({ line, view }) => (
              <li
                key={key(line.productId, line.shadeId)}
                className="flex gap-4 py-5"
              >
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
                      className="block truncate text-sm transition-colors hover:text-accent-text"
                    >
                      {view.productName}
                    </Link>
                  ) : (
                    <p className="truncate text-sm text-ink-muted">
                      {labels.unavailable}
                    </p>
                  )}

                  {/* A line can be known and still unbuyable — sold out, or a
                      shade never chosen. Without this the row looked ordinary
                      and only the disabled checkout button hinted at a problem,
                      with nothing saying which item or why. */}
                  {view && !view.available ? (
                    <p className="mt-1 text-[0.625rem] tracking-[0.14em] text-ink-muted uppercase">
                      {labels.unavailable}
                    </p>
                  ) : null}

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
                        className="px-2.5 py-1 text-sm transition-colors hover:text-accent-text"
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-xs tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQuantity(line, line.quantity + 1)}
                        className="px-2.5 py-1 text-sm transition-colors hover:text-accent-text"
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

            {/* Say why the button is dead, next to the button. */}
            {!error && hasUnavailable ? (
              <p role="status" className="mt-3 text-sm text-ink-soft">
                {labels.unavailableNote}
              </p>
            ) : null}

            {/* Working and unavailable are different states and must not look
                alike. A faded button reading "…" reads as broken, which is what
                it was reported as. Busy keeps full contrast and says what is
                happening; only a genuinely unbuyable basket fades. */}
            <button
              type="button"
              onClick={checkout}
              disabled={busy || hasUnavailable}
              aria-busy={busy}
              className={`mt-4 w-full bg-ink px-6 py-4 text-[0.6875rem] tracking-[0.2em] text-canvas uppercase transition-colors duration-500 ${
                busy ? "cursor-wait" : "hover:bg-accent hover:text-ink disabled:opacity-40"
              }`}
            >
              {busy ? labels.checkoutBusy : labels.checkout}
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 w-full text-[0.625rem] tracking-[0.16em] text-ink-muted uppercase transition-colors hover:text-ink"
            >
              {labels.continue}
            </button>

            {labels.note ? (
              <p className="mt-4 text-xs text-ink-muted">{labels.note}</p>
            ) : null}
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
      className="tap text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-300 hover:text-accent-text"
    >
      {label}
      {count > 0 ? <span className="tabular-nums"> ({count})</span> : null}
    </button>
  );
}
