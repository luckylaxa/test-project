import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCopyrightYear, getSiteSettings } from "@/lib/content";
import { footerColumns, links, socialLinks } from "@/lib/section-content";

/** Chrome shared by every public page. Admin routes sit outside this group. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, year] = await Promise.all([getSiteSettings(), getCopyrightYear()]);
  const brandName = settings?.brand_name ?? "";
  const social = socialLinks(settings?.social_links);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-ink focus:px-5 focus:py-3 focus:text-[0.6875rem] focus:tracking-[0.2em] focus:text-canvas focus:uppercase"
      >
        Skip to content
      </a>

      <Header
        brandName={brandName}
        logoUrl={settings?.logo_url ?? null}
        logoAlt={settings?.logo_alt ?? brandName}
        navLinks={links(settings?.nav_links)}
        socialLinks={social}
      />

      <main id="main">{children}</main>

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
    </>
  );
}
