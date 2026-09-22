"use server";

import { createHmac, timingSafeEqual } from "node:crypto";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { gallery } from "@/lib/section-content";
import type { CartLine } from "./types";

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
  // `needs` lets the basket send the customer somewhere useful rather than
  // just showing them a wall of text.
  | { ok: false; error: string; needs?: "sign-in" | "address" };

const MAX_LINES = 20;
const MAX_QUANTITY = 20;

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

  if (clean.length === 0) return { ok: false, error: "Your basket is empty." };

  const supabase = createPublicClient();

  const [{ data: settings }, { data: products }] = await Promise.all([
    supabase
      .from("site_settings")
      .select("currency, checkout_enabled, demo_checkout, brand_name")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("products")
      .select("id, name, slug, price_amount, is_purchasable, is_visible, gallery, shades(id, name, is_visible)")
      .in("id", clean.map((l) => l.productId)),
  ]);

  if (!settings?.checkout_enabled) {
    return { ok: false, error: "Checkout is currently closed. Please use the enquiry form." };
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
      return { ok: false, error: "One of the items is no longer available. Please review your basket." };
    }
    if (typeof product.price_amount !== "number" || product.price_amount <= 0) {
      return { ok: false, error: "One of the items is not priced for purchase yet." };
    }

    let shadeName: string | null = null;
    if (line.shadeId) {
      const shade = (product.shades ?? []).find((s) => s.id === line.shadeId && s.is_visible);
      if (!shade) {
        return { ok: false, error: "One of the shades is no longer available. Please review your basket." };
      }
      shadeName = shade.name;
    }

    // The price comes from this row, never from the request body.
    total += product.price_amount * line.quantity;
    summary.push(
      `${line.quantity} × ${shadeName ? `${product.name} — ${shadeName}` : product.name}`,
    );
    void gallery(product.gallery);
  }

  if (total <= 0) return { ok: false, error: "Your basket is empty." };

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
      error: "Please sign in or create an account so we can deliver your order.",
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
      error: "Please add a delivery address before checking out.",
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
      error: "Checkout is not configured yet. Please use the enquiry form, or try again later.",
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

    if (!response.ok) return { ok: false, error: "We could not start checkout just now. Please try again." };

    const order = (await response.json()) as { id?: string; amount?: number; currency?: string };
    if (!order.id) return { ok: false, error: "We could not start checkout just now. Please try again." };

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
    return { ok: false, error: "We could not start checkout just now. Please try again." };
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
