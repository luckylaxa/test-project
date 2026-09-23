import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageTransition } from "@/components/layout/page-transition";
import { getCopyrightYear, getSiteSettings } from "@/lib/content";
import { footerColumns, links, socialLinks } from "@/lib/section-content";
import { makeLabels } from "@/lib/labels";
import { CartProvider } from "@/components/cart/cart-provider";
import { SavedProvider } from "@/components/ui/saved-provider";
import { ShopProvider } from "@/components/ui/shop-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { getCartCatalogue } from "@/lib/cart/catalogue";

/** Chrome shared by every public page. Admin routes sit outside this group. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, year, catalogue] = await Promise.all([
    getSiteSettings(),
    getCopyrightYear(),
    getCartCatalogue(),
  ]);
  const brandName = settings?.brand_name ?? "";
  const social = socialLinks(settings?.social_links);
  const labels = makeLabels(settings);

  const showCart = settings?.checkout_enabled ?? false;
  // Exactly the rule createCheckout applies, so the basket can never promise a
  // demonstration while real payments are being taken. This is a server
  // component: only the boolean crosses to the browser, never the key.
  const demoCheckout =
    (settings?.demo_checkout ?? false) &&
    !(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

  return (
    <CartProvider>
    <SavedProvider>
    <ShopProvider
      value={{
        checkoutEnabled: showCart,
        currency: settings?.currency ?? "INR",
        labels: {
          save: labels.t("wishlist_add"),
          saved: labels.t("wishlist_remove"),
          add: labels.t("add_to_cart_short"),
          chooseShade: labels.t("quick_add_shade"),
          close: labels.t("cart_close"),
          stockOut: labels.t("stock_out_short"),
          stockLow: labels.t("stock_low"),
        },
      }}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-ink focus:px-5 focus:py-3 focus:text-[0.6875rem] focus:tracking-[0.2em] focus:text-canvas focus:uppercase"
      >
        {labels.t("skip_to_content")}
      </a>

      <Header
        brandName={brandName}
        logoUrl={settings?.logo_url ?? null}
        logoLightUrl={settings?.logo_light_url ?? null}
        logoAlt={settings?.logo_alt ?? brandName}
        navLinks={links(settings?.nav_links)}
        socialLinks={social}
        labels={{
          navPrimary: labels.t("nav_primary_label"),
          menuOpen: labels.t("menu_open"),
          menuClose: labels.t("menu_close"),
          search: labels.t("search_label"),
          cart: labels.t("cart_button"),
          account: labels.t("account_title"),
        }}
        showCart={showCart}
      />

      <main id="main">
        <PageTransition>{children}</PageTransition>
      </main>

      <Footer
        brandName={brandName}
        logoUrl={settings?.logo_url ?? null}
        logoAlt={settings?.logo_alt ?? brandName}
        footerText={settings?.footer_text ?? null}
        columns={footerColumns(settings?.footer_columns)}
        socialLinks={social}
        legalLinks={links(settings?.legal_links)}
        contactEmail={settings?.contact_email ?? null}
        contactPhone={settings?.contact_phone ?? null}
        contactAddress={settings?.contact_address ?? null}
        contactTitle={labels.t("footer_contact_title")}
        year={year}
      />

      {showCart ? (
        <CartDrawer
          catalogue={catalogue}
          currency={settings?.currency ?? "INR"}
          labels={{
            title: labels.t("cart_title"),
            empty: labels.t("cart_empty"),
            emptyShop: labels.t("cart_empty_shop"),
            emptyTryOn: labels.t("cart_empty_try_on"),
            emptySaved: labels.t("cart_empty_saved"),
            subtotal: labels.t("cart_subtotal"),
            checkout: labels.t("cart_checkout"),
            checkoutBusy: labels.t("cart_checkout_busy"),
            continue: labels.t("cart_continue"),
            remove: labels.t("cart_remove"),
            close: labels.t("cart_close"),
            unavailable: labels.t("cart_unavailable"),
            unavailableNote: labels.t("cart_unavailable_note"),
            checkoutErrors: {
              checkout_error_empty: labels.t("checkout_error_empty"),
              checkout_error_closed: labels.t("checkout_error_closed"),
              checkout_error_unavailable: labels.t("checkout_error_unavailable"),
              checkout_error_unpriced: labels.t("checkout_error_unpriced"),
              checkout_error_sold_out: labels.t("checkout_error_sold_out"),
              checkout_error_shade_gone: labels.t("checkout_error_shade_gone"),
              checkout_error_shade_sold_out: labels.t("checkout_error_shade_sold_out"),
              checkout_error_shade_required: labels.t("checkout_error_shade_required"),
              checkout_error_sign_in: labels.t("checkout_error_sign_in"),
              checkout_error_address: labels.t("checkout_error_address"),
              checkout_error_not_configured: labels.t("checkout_error_not_configured"),
              checkout_error_failed: labels.t("checkout_error_failed"),
            },
            paymentUnavailable: labels.t("cart_payment_unavailable"),
            paymentUnverified: labels.t("cart_payment_unverified"),
            // Say so before they check out, not only after.
            note: demoCheckout ? labels.t("cart_demo_note") : labels.t("cart_note"),
          }}
        />
      ) : null}
    </ShopProvider>
    </SavedProvider>
    </CartProvider>
  );
}
