"use server";

import Stripe from "stripe";
import { createPublicClient } from "@/lib/supabase/public";
import { gallery } from "@/lib/section-content";
import { siteUrl } from "@/lib/metadata";
import type { CartLine } from "./types";

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

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
 */
export async function createCheckout(lines: CartLine[]): Promise<CheckoutResult> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return {
      ok: false,
      error: "Checkout is not configured yet. Please use the enquiry form, or try again later.",
    };
  }

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

  try {
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items,
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
