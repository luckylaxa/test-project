import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageTransition } from "@/components/layout/page-transition";
import { getCopyrightYear, getSiteSettings } from "@/lib/content";
import { footerColumns, links, socialLinks } from "@/lib/section-content";
import { makeLabels } from "@/lib/labels";
import { CartProvider } from "@/components/cart/cart-provider";
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

  return (
    <CartProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-ink focus:px-5 focus:py-3 focus:text-[0.6875rem] focus:tracking-[0.2em] focus:text-canvas focus:uppercase"
      >
        {labels.t("skip_to_content")}
      </a>

      <Header
        brandName={brandName}
        logoUrl={settings?.logo_url ?? null}
        logoAlt={settings?.logo_alt ?? brandName}
        navLinks={links(settings?.nav_links)}
        socialLinks={social}
        labels={{
          navPrimary: labels.t("nav_primary_label"),
          menuOpen: labels.t("menu_open"),
          menuClose: labels.t("menu_close"),
          cart: labels.t("cart_button"),
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
        year={year}
      />

      {showCart ? (
        <CartDrawer
          catalogue={catalogue}
          currency={settings?.currency ?? "EUR"}
          labels={{
            title: labels.t("cart_title"),
            empty: labels.t("cart_empty"),
            subtotal: labels.t("cart_subtotal"),
            checkout: labels.t("cart_checkout"),
            continue: labels.t("cart_continue"),
            remove: labels.t("cart_remove"),
            close: labels.t("cart_close"),
            unavailable: labels.t("cart_unavailable"),
            note: labels.t("cart_note"),
          }}
        />
      ) : null}
    </CartProvider>
  );
}
