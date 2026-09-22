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

/**
 * Loads Razorpay's widget, and only when someone is actually paying.
 *
 * Keeping it out of the bundle means browsing the site makes no request to a
 * payment provider at all — the same rule the try-on studio follows for its
 * model.
 */
export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === "undefined") return Promise.reject(new Error("server"));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement("script");

    const done = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("unavailable")));
    script.addEventListener("load", done, { once: true });
    script.addEventListener("error", () => reject(new Error("unavailable")), { once: true });

    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
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
