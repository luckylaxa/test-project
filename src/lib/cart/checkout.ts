"use server";

import { createHmac, timingSafeEqual } from "node:crypto";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { gallery } from "@/lib/section-content";
import { MAX_LINES, MAX_QUANTITY, type CartLine } from "./types";

/** What the browser needs to open Razorpay's payment modal. */
export type RazorpayOrder = {
  orderId: string;
  amount: number;
  currency: string;
  /** Public by design — it identifies the merchant, it does not authorise. */
  keyId: string;
  brandName: string;
  prefill: { name: string; email: string; contact: string };
};

export type CheckoutResult =
  | { ok: true; order: RazorpayOrder }
  // Demonstration mode skips payment entirely and goes straight to the
  // confirmation, which says plainly that nothing was charged.
  | { ok: true; demoUrl: string }
  /*
   * `errorKey` is a `ui_labels` key, not a sentence: these are read by a
   * customer at the moment a purchase fails, so the brand team has to be able
   * to reword them. `needs` lets the basket send someone somewhere useful
   * rather than just showing them a wall of text.
   */
  | { ok: false; errorKey: CheckoutErrorKey; needs?: "sign-in" | "address" };

export type CheckoutErrorKey =
  | "checkout_error_empty"
  | "checkout_error_closed"
  | "checkout_error_unavailable"
  | "checkout_error_unpriced"
  | "checkout_error_sold_out"
  | "checkout_error_shade_gone"
  | "checkout_error_shade_sold_out"
  | "checkout_error_shade_required"
  | "checkout_error_sign_in"
  | "checkout_error_address"
  | "checkout_error_not_configured"
  | "checkout_error_failed";

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return keyId && keySecret ? { keyId, keySecret } : null;
}

/**
 * Turns a basket into a Razorpay order.
 *
 * The browser sends only product ids, shade ids and quantities. Every price,
 * name and image is read back from the database here. That is the whole point:
 * a customer can edit anything in their own browser, so nothing they send about
 * money is trusted. A tampered basket simply gets the real prices.
 *
 * Card details never reach this site — Razorpay's own modal collects them, so
 * we stay out of PCI scope entirely. The order is created server side so the
 * amount is fixed before the customer ever sees a payment form.
 *
 * A signed-in customer with a delivery address is required: an order that
 * cannot be delivered is not an order. The address is read from `customers`,
 * where RLS means a customer can only ever fetch their own.
 */
export async function createCheckout(lines: CartLine[]): Promise<CheckoutResult> {
  // Shape check before anything touches the database.
  const clean = (Array.isArray(lines) ? lines : [])
    .filter(
      (l) =>
        l &&
        typeof l.productId === "string" &&
        (l.shadeId === null || typeof l.shadeId === "string") &&
        Number.isInteger(l.quantity) &&
        l.quantity > 0,
    )
    .slice(0, MAX_LINES)
    .map((l) => ({ ...l, quantity: Math.min(l.quantity, MAX_QUANTITY) }));

  if (clean.length === 0) return { ok: false, errorKey: "checkout_error_empty" };

  const supabase = createPublicClient();

  const [{ data: settings }, { data: products }] = await Promise.all([
    supabase
      .from("site_settings")
      .select("currency, checkout_enabled, demo_checkout, brand_name")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("products")
      .select("id, name, slug, price_amount, is_purchasable, is_visible, stock_status, gallery, shades(id, name, is_visible, is_in_stock)")
      .in("id", clean.map((l) => l.productId)),
  ]);

  if (!settings?.checkout_enabled) {
    return { ok: false, errorKey: "checkout_error_closed" };
  }

  const currency = (settings.currency || "INR").toUpperCase();
  const byId = new Map((products ?? []).map((p) => [p.id, p]));

  let total = 0;
  const summary: string[] = [];

  for (const line of clean) {
    const product = byId.get(line.productId);

    // Silently dropping an unavailable item would let someone check out a
    // basket that is not what they saw, so refuse the whole thing instead.
    if (!product || !product.is_visible || !product.is_purchasable) {
      return { ok: false, errorKey: "checkout_error_unavailable" };
    }
    if (typeof product.price_amount !== "number" || product.price_amount <= 0) {
      return { ok: false, errorKey: "checkout_error_unpriced" };
    }
    if (product.stock_status === "out_of_stock") {
      return { ok: false, errorKey: "checkout_error_sold_out" };
    }

    const visibleShades = (product.shades ?? []).filter((s) => s.is_visible);

    let shadeName: string | null = null;
    if (line.shadeId) {
      const shade = visibleShades.find((s) => s.id === line.shadeId);
      if (!shade) {
        return { ok: false, errorKey: "checkout_error_shade_gone" };
      }
      if (!shade.is_in_stock) {
        return { ok: false, errorKey: "checkout_error_shade_sold_out" };
      }
      shadeName = shade.name;
    } else if (visibleShades.length > 0) {
      // A shade-bearing product with no shade chosen must never be charged for:
      // nobody can pack it, and the customer did not pick a colour. A related
      // product card used to produce exactly this line.
      return { ok: false, errorKey: "checkout_error_shade_required" };
    }

    // The price comes from this row, never from the request body.
    total += product.price_amount * line.quantity;
    summary.push(
      `${line.quantity} × ${shadeName ? `${product.name} — ${shadeName}` : product.name}`,
    );
    void gallery(product.gallery);
  }

  if (total <= 0) return { ok: false, errorKey: "checkout_error_empty" };

  // Who is buying, and where does it go? This is the last gate before payment:
  // the basket and the shop have already been checked, so nobody is asked to
  // make an account only to be told the item is gone or the shop is closed.
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user) {
    return {
      ok: false,
      needs: "sign-in",
      errorKey: "checkout_error_sign_in",
    };
  }

  const { data: customer } = await auth
    .from("customers")
    .select("email, full_name, phone, address_line1, address_line2, city, postal_code, country")
    .eq("user_id", user.id)
    .maybeSingle();

  const hasAddress = Boolean(
    customer?.address_line1 && customer?.city && customer?.postal_code && customer?.country,
  );
  if (!hasAddress) {
    return {
      ok: false,
      needs: "address",
      errorKey: "checkout_error_address",
    };
  }

  const creds = credentials();

  // Demonstration mode: everything above still had to pass. Only the payment
  // is skipped, and the page it lands on says so. Configured keys always win,
  // so enabling real payments cannot be undone by a forgotten toggle.
  if (!creds && settings.demo_checkout) {
    return { ok: true, demoUrl: "/checkout/complete?demo=1" };
  }

  if (!creds) {
    return {
      ok: false,
      errorKey: "checkout_error_not_configured",
    };
  }

  try {
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: total,
        currency,
        // Ties the order back to the customer without a table of our own.
        notes: {
          user_id: user.id,
          items: summary.join(", ").slice(0, 250),
          deliver_to: [customer?.address_line1, customer?.city, customer?.postal_code, customer?.country]
            .filter(Boolean)
            .join(", ")
            .slice(0, 250),
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) return { ok: false, errorKey: "checkout_error_failed" };

    const order = (await response.json()) as { id?: string; amount?: number; currency?: string };
    if (!order.id) return { ok: false, errorKey: "checkout_error_failed" };

    return {
      ok: true,
      order: {
        orderId: order.id,
        amount: order.amount ?? total,
        currency: order.currency ?? currency,
        keyId: creds.keyId,
        brandName: settings.brand_name || "",
        prefill: {
          name: customer?.full_name ?? "",
          email: user.email ?? customer?.email ?? "",
          contact: customer?.phone ?? "",
        },
      },
    };
  } catch {
    // Never surface a provider error verbatim — it can leak configuration.
    return { ok: false, errorKey: "checkout_error_failed" };
  }
}

/**
 * Confirms that a payment really happened.
 *
 * The browser reports its own success, which is worth nothing on its own —
 * anyone can call this action with invented ids. Razorpay signs
 * `order_id|payment_id` with the key secret, which only the server holds, so
 * recomputing the HMAC is what actually proves the payment. Compared in
 * constant time, because a byte-by-byte comparison leaks the expected value.
 */
export async function verifyPayment(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<{ ok: boolean }> {
  const creds = credentials();
  if (!creds) return { ok: false };

  const { orderId, paymentId, signature } = input;
  if (
    typeof orderId !== "string" ||
    typeof paymentId !== "string" ||
    typeof signature !== "string"
  ) {
    return { ok: false };
  }

  const expected = createHmac("sha256", creds.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest();
  const given = Buffer.from(signature, "hex");

  if (expected.length !== given.length) return { ok: false };
  return { ok: timingSafeEqual(expected, given) };
}
