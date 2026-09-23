import type { RazorpayOrder } from "./checkout";

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => {
  open: () => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/** The in-flight or successful load. Dropped on failure, so a retry retries. */
let pending: Promise<RazorpayConstructor> | null = null;

/** A request that never answers must not hold the basket button for ever. */
const LOAD_TIMEOUT_MS = 15000;

/**
 * Loads Razorpay's widget, and only when someone is actually paying.
 *
 * Keeping it out of the bundle means browsing the site makes no request to a
 * payment provider at all — the same rule the try-on studio follows for its
 * model.
 *
 * The previous version reused any `<script>` already in the document. That is
 * right while one is still loading and wrong once one has finished: a script
 * that already failed keeps its tag, so the next attempt found it, attached
 * `load`/`error` listeners to events that had **already fired**, appended
 * nothing, and waited for ever. The promise never settled, so the basket's
 * checkout button sat disabled with no message — one dropped request on a
 * patchy connection and buying was impossible for the rest of the visit.
 *
 * So the load is tracked here instead of being inferred from the DOM, a failed
 * tag is removed, and a failed attempt is forgotten.
 */
export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === "undefined") return Promise.reject(new Error("server"));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (pending) return pending;

  pending = new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    let settled = false;
    let timer = 0;

    const fail = (reason: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      script.remove();
      reject(new Error(reason));
    };

    script.addEventListener(
      "load",
      () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        if (window.Razorpay) resolve(window.Razorpay);
        else {
          script.remove();
          reject(new Error("unavailable"));
        }
      },
      { once: true },
    );
    script.addEventListener("error", () => fail("unavailable"), { once: true });

    timer = window.setTimeout(() => fail("timeout"), LOAD_TIMEOUT_MS);

    script.src = SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  });

  // Remembering a rejection would hand every later attempt the same failure
  // without ever asking the network again.
  pending.catch(() => {
    pending = null;
  });

  return pending;
}

/**
 * Opens the payment modal and resolves with what Razorpay reports.
 *
 * Resolving with null means the customer closed it without paying, which is
 * not an error — their basket should simply still be there.
 */
export function payWithRazorpay(
  order: RazorpayOrder,
  Razorpay: RazorpayConstructor,
): Promise<RazorpayHandlerResponse | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: RazorpayHandlerResponse | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const instance = new Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: order.brandName,
      prefill: order.prefill,
      // The maison's own accent, so the modal does not arrive unannounced.
      theme: { color: "#c2a36b" },
      modal: { ondismiss: () => finish(null) },
      handler: (response: RazorpayHandlerResponse) => finish(response),
    } as Record<string, unknown>);

    instance.on("payment.failed", () => finish(null));
    instance.open();
  });
}
