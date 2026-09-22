"use server";

import Stripe from "stripe";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { gallery } from "@/lib/section-content";
import { siteUrl } from "@/lib/metadata";
import type { CartLine } from "./types";

export type CheckoutResult =
  | { ok: true; url: string }
  // `needs` lets the basket send the customer somewhere useful rather than
  // just showing them a wall of text.
  | { ok: false; error: string; needs?: "sign-in" | "address" };

const MAX_LINES = 20;
const MAX_QUANTITY = 20;

/**
 * Turns a basket into a Stripe Checkout Session.
 *
 * The browser sends only product ids, shade ids and quantities. Every price,
 * name and image is read back from the database here. That is the whole point:
 * a customer can edit anything in their own browser, so nothing they send about
 * money is trusted. A tampered basket simply gets the real prices.
 *
 * Card details never reach this site — Stripe's hosted page collects them, so
 * we stay out of PCI scope entirely.
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
    supabase.from("site_settings").select("currency, checkout_enabled, brand_name").eq("id", 1).maybeSingle(),
    supabase
      .from("products")
      .select("id, name, slug, price_amount, is_purchasable, is_visible, gallery, shades(id, name, is_visible)")
      .in("id", clean.map((l) => l.productId)),
  ]);

  if (!settings?.checkout_enabled) {
    return { ok: false, error: "Checkout is currently closed. Please use the enquiry form." };
  }

  const currency = (settings.currency || "EUR").toLowerCase();
  const byId = new Map((products ?? []).map((p) => [p.id, p]));

  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

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

    const image = gallery(product.gallery)[0]?.url;
    const absoluteImage = image?.startsWith("http") ? image : image ? `${siteUrl()}${image}` : undefined;

    items.push({
      quantity: line.quantity,
      price_data: {
        currency,
        // The price comes from this row, never from the request body.
        unit_amount: product.price_amount,
        product_data: {
          name: shadeName ? `${product.name} — ${shadeName}` : product.name,
          images: absoluteImage ? [absoluteImage] : undefined,
          metadata: { product_id: product.id, shade_id: line.shadeId ?? "" },
        },
      },
    });
  }

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

  // Checked last, because a missing key is our problem, not something the
  // customer can act on — telling them to sign in first would be a dead end.
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return {
      ok: false,
      error: "Checkout is not configured yet. Please use the enquiry form, or try again later.",
    };
  }

  try {
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items,
      customer_email: user.email ?? customer?.email ?? undefined,
      // Prefilled from the account, but Stripe still lets them correct it.
      shipping_address_collection: {
        allowed_countries: [customer!.country as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry],
      },
      metadata: { user_id: user.id },
      success_url: `${siteUrl()}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/checkout/cancelled`,
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
    });

    if (!session.url) return { ok: false, error: "Stripe did not return a checkout page." };
    return { ok: true, url: session.url };
  } catch {
    // Never surface a provider error verbatim — it can leak configuration.
    return { ok: false, error: "We could not start checkout just now. Please try again." };
  }
}
