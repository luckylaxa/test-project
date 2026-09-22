import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/content";
import { makeLabels } from "@/lib/labels";
import { buildMetadata } from "@/lib/metadata";
import { AuthForm } from "./auth-form";
import { AccountForm } from "./account-form";
import { Orders } from "./orders";
import { Saved, type SavedItem } from "./saved";
import { gallery } from "@/lib/section-content";
import { listOrders } from "@/lib/orders";
import { isGoogleEnabled } from "@/lib/auth-providers";
import { signOutCustomer } from "./actions";

// Reads the session cookie, so it renders per request and is never cached.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const labels = makeLabels(settings);
  return {
    ...(await buildMetadata({ title: labels.t("account_title"), path: "/account" })),
    // A personal page should never be indexed.
    robots: { index: false, follow: false },
  };
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; next?: string }>;
}) {
  const [{ reason, next }, settings, supabase, googleEnabled] = await Promise.all([
    searchParams,
    getSiteSettings(),
    createClient(),
    // Asked of the auth server, not of a setting, so the button cannot be
    // missing because somebody forgot a toggle.
    isGoogleEnabled(),
  ]);
  const labels = makeLabels(settings);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const message =
      reason === "checkout"
        ? labels.t("checkout_signin_required")
        : reason === "address"
          ? labels.t("checkout_address_required")
          : null;

    return (
      <section className="shell flex min-h-[70svh] items-center justify-center py-24">
        <div className="w-full max-w-sm">
          <Suspense fallback={null}>
            <AuthForm
              googleEnabled={googleEnabled}
              labels={{
                signInTitle: labels.t("account_signin_title"),
                signUpTitle: labels.t("account_signup_title"),
                signInCta: labels.t("account_signin_cta"),
                signUpCta: labels.t("account_signup_cta"),
                toSignUp: labels.t("account_switch_to_signup"),
                toSignIn: labels.t("account_switch_to_signin"),
                checkEmail: labels.t("account_check_email"),
                google: labels.t("account_google"),
                or: labels.t("account_or"),
                email: labels.t("account_email"),
                password: labels.t("account_password"),
                passwordHelp: labels.t("account_password_help"),
                reason: message,
                errors: {
                  credentials: labels.t("account_error_credentials"),
                  emailTaken: labels.t("account_error_email_taken"),
                  emailInvalid: labels.t("account_error_email_invalid"),
                  weakPassword: labels.t("account_error_weak_password"),
                  rateLimited: labels.t("account_error_rate_limited"),
                  network: labels.t("account_error_network"),
                  generic: labels.t("account_error_generic"),
                  oauth: labels.t("account_error_oauth"),
                  confirm: labels.t("account_error_confirm"),
                },
              }}
            />
          </Suspense>
        </div>
      </section>
    );
  }

  // With no payment provider at all — a demonstration site — there are no
  // orders to fail to load, so the section is absent rather than apologetic.
  const paymentsConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
  );

  // Scoped to this customer, so one person's orders can never reach another.
  const [{ data: customer }, orders, { data: savedRows }] = await Promise.all([
    supabase.from("customers").select("*").eq("user_id", user.id).maybeSingle(),
    paymentsConfigured ? listOrders({ userId: user.id }) : Promise.resolve(null),
    supabase
      .from("wishlist")
      .select("product_id, created_at, products(id, name, slug, price_amount, gallery, is_visible)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  // A product hidden or deleted since it was saved simply drops out.
  const saved: SavedItem[] = (savedRows ?? []).flatMap((row) => {
    const p = row.products;
    if (!p || !p.is_visible) return [];
    const image = gallery(p.gallery)[0];
    return [
      {
        id: p.id,
        name: p.name,
        slug: p.slug,
        priceAmount: p.price_amount,
        image: image?.url ?? null,
        imageAlt: image?.alt ?? p.name,
      },
    ];
  });

  return (
    <section className="shell py-32 md:py-40">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl">{labels.t("account_title")}</h1>
          <p className="mt-2 text-sm text-ink-muted">{user.email}</p>
        </div>
        <form action={signOutCustomer}>
          <button
            type="submit"
            className="border border-line px-5 py-2.5 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:border-ink"
          >
            {labels.t("account_signout")}
          </button>
        </form>
      </div>

      {reason === "address" ? (
        <p className="measure mt-6 border border-line px-5 py-4 text-sm text-ink-soft">
          {labels.t("checkout_address_required")}
        </p>
      ) : null}

      <AccountForm
        customer={customer}
        returnTo={next && next.startsWith("/") && !next.startsWith("//") ? next : null}
        suggestedName={
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.name === "string"
              ? user.user_metadata.name
              : null
        }
        labels={{
          title: labels.t("account_delivery_title"),
          help: labels.t("account_delivery_help"),
          saved: labels.t("account_saved"),
          save: labels.t("account_save"),
          fullName: labels.t("account_field_full_name"),
          phone: labels.t("account_field_phone"),
          address1: labels.t("account_field_address1"),
          address2: labels.t("account_field_address2"),
          city: labels.t("account_field_city"),
          postcode: labels.t("account_field_postcode"),
          country: labels.t("account_field_country"),
          countryEmpty: labels.t("account_field_country_empty"),
        }}
      />

      <Saved
        items={saved}
        currency={settings?.currency ?? "INR"}
        labels={{ title: labels.t("wishlist_title"), empty: labels.t("wishlist_empty") }}
      />

      {paymentsConfigured ? (
        <Orders
          orders={orders}
          labels={{
            title: labels.t("account_orders_title"),
            empty: labels.t("account_orders_empty"),
            unavailable: labels.t("account_orders_unavailable"),
            paid: labels.t("account_order_paid"),
            refunded: labels.t("account_order_refunded"),
            trackingTitle: labels.t("order_tracking_title"),
            courier: labels.t("order_tracking_courier"),
            trackingNumber: labels.t("order_tracking_number"),
            trackingLink: labels.t("order_tracking_link"),
            refundNote: labels.t("order_refund_note"),
            refundPartial: labels.t("order_refund_partial"),
            step: {
              placed: labels.t("order_status_placed"),
              packed: labels.t("order_status_packed"),
              shipped: labels.t("order_status_shipped"),
              out_for_delivery: labels.t("order_status_out_for_delivery"),
              delivered: labels.t("order_status_delivered"),
              cancelled: labels.t("order_status_cancelled"),
            },
          }}
        />
      ) : null}
    </section>
  );
}
