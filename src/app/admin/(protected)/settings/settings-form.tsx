"use client";

import { ColorField, Select, TextArea, TextInput, Toggle } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-field";
import { SaveBar, useEditor } from "@/components/admin/save-bar";
import { RepeaterLinks, RepeaterFooter } from "@/components/admin/repeaters";
import type { SiteSettings } from "@/lib/content";
import { footerColumns, links, socialLinks } from "@/lib/section-content";
import { saveSettings } from "./actions";

type Form = {
  brand_name: string;
  logo: { url: string; alt: string };
  favicon_url: string;
  accent_color: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  social: { label: string; href: string }[];
  nav: { label: string; href: string }[];
  footer: { title: string | null; links: { label: string; href: string }[] }[];
  footer_text: string;
  legal: { label: string; href: string }[];
  seo_title: string;
  seo_description: string;
  seo_og_image_url: string;
  try_on_disclaimer: string;
  camera_permission_title: string;
  camera_permission_body: string;
  currency: string;
  checkout_enabled: boolean;
};

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const editor = useEditor<Form>({
    brand_name: settings.brand_name ?? "",
    logo: { url: settings.logo_url ?? "", alt: settings.logo_alt ?? "" },
    favicon_url: settings.favicon_url ?? "",
    accent_color: settings.accent_color ?? "#C2A36B",
    contact_email: settings.contact_email ?? "",
    contact_phone: settings.contact_phone ?? "",
    contact_address: settings.contact_address ?? "",
    social: socialLinks(settings.social_links).map((s) => ({ label: s.label, href: s.url })),
    nav: links(settings.nav_links),
    footer: footerColumns(settings.footer_columns),
    footer_text: settings.footer_text ?? "",
    legal: links(settings.legal_links),
    seo_title: settings.seo_title ?? "",
    seo_description: settings.seo_description ?? "",
    seo_og_image_url: settings.seo_og_image_url ?? "",
    try_on_disclaimer: settings.try_on_disclaimer ?? "",
    camera_permission_title: settings.camera_permission_title ?? "",
    camera_permission_body: settings.camera_permission_body ?? "",
    currency: settings.currency ?? "EUR",
    checkout_enabled: settings.checkout_enabled ?? false,
  });

  const { value: v, set } = editor;

  const onSave = () =>
    editor.save((form) =>
      saveSettings({
        brand_name: form.brand_name,
        logo_url: form.logo.url || null,
        logo_alt: form.logo.alt || null,
        favicon_url: form.favicon_url || null,
        accent_color: form.accent_color,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        contact_address: form.contact_address || null,
        social_links: form.social.map((s) => ({ label: s.label, url: s.href })),
        nav_links: form.nav,
        footer_columns: form.footer,
        footer_text: form.footer_text || null,
        legal_links: form.legal,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        seo_og_image_url: form.seo_og_image_url || null,
        try_on_disclaimer: form.try_on_disclaimer || null,
        camera_permission_title: form.camera_permission_title || null,
        camera_permission_body: form.camera_permission_body || null,
        currency: form.currency,
        checkout_enabled: form.checkout_enabled,
      }),
    );

  return (
    <div className="max-w-2xl">
      <Section title="The brand">
        <TextInput
          label="Brand name"
          help="Shown in the header, the footer and the browser tab."
          value={v.brand_name}
          onChange={(x) => set("brand_name", x)}
          max={60}
        />
        <MediaField
          label="Logo"
          help="Leave empty to show the brand name as text instead. A transparent PNG or SVG works best."
          value={v.logo}
          onChange={(x) => set("logo", x)}
          accept="image/png,image/svg+xml,image/webp"
        />
        <ColorField
          label="Accent colour"
          help="Used for hover states, underlines and highlights across the site. This is the one colour you control."
          value={v.accent_color}
          onChange={(x) => set("accent_color", x)}
        />
      </Section>

      <Section title="Contact details" help="These appear in the footer and on the contact page.">
        <TextInput label="Email" value={v.contact_email} onChange={(x) => set("contact_email", x)} type="email" />
        <TextInput label="Telephone" value={v.contact_phone} onChange={(x) => set("contact_phone", x)} />
        <TextArea label="Address" value={v.contact_address} onChange={(x) => set("contact_address", x)} rows={3} />
      </Section>

      <Section title="Menu" help="The links across the top of every page. Drag to reorder.">
        <RepeaterLinks value={v.nav} onChange={(x) => set("nav", x)} addLabel="Add a menu link" />
      </Section>

      <Section title="Footer">
        <TextArea
          label="Footer sentence"
          help="A short line under the logo in the footer."
          value={v.footer_text}
          onChange={(x) => set("footer_text", x)}
          max={160}
          rows={2}
        />
        <RepeaterFooter value={v.footer} onChange={(x) => set("footer", x)} />
        <div className="pt-2">
          <p className="mb-3 text-[0.6875rem] tracking-[0.14em] uppercase">Legal links</p>
          <RepeaterLinks value={v.legal} onChange={(x) => set("legal", x)} addLabel="Add a legal link" />
        </div>
      </Section>

      <Section title="Social links">
        <RepeaterLinks
          value={v.social}
          onChange={(x) => set("social", x)}
          addLabel="Add a social link"
          hrefLabel="Web address"
        />
      </Section>

      <Section
        title="Search engines"
        help="Used when a page has no wording of its own, and when someone shares a link."
      >
        <TextInput
          label="Default page title"
          value={v.seo_title}
          onChange={(x) => set("seo_title", x)}
          max={60}
          help="Around 60 characters reads best in Google."
        />
        <TextArea
          label="Default description"
          value={v.seo_description}
          onChange={(x) => set("seo_description", x)}
          max={160}
          rows={3}
          help="Around 160 characters."
        />
        <MediaField
          label="Default sharing image"
          help="Shown when a link to the site is shared. A wide image works best."
          value={{ url: v.seo_og_image_url, alt: "" }}
          onChange={(x) => set("seo_og_image_url", x.url)}
          altRequired={false}
        />
      </Section>

      <Section
        title="Selling"
        help="Payment is handled by Stripe on their own secure page — card details never reach this website."
      >
        <Toggle
          label="Open the shop"
          help="When this is off, no Add to basket buttons appear anywhere and checkout is refused, even if someone has items saved in their browser."
          checked={v.checkout_enabled}
          onChange={(x) => set("checkout_enabled", x)}
        />
        <Select
          label="Currency"
          help="Every product is charged in this currency. Change it only if your Stripe account is set up for it."
          value={v.currency}
          onChange={(x) => set("currency", x)}
          options={[
            { value: "EUR", label: "Euro (EUR)" },
            { value: "GBP", label: "Pound sterling (GBP)" },
            { value: "USD", label: "US dollar (USD)" },
            { value: "INR", label: "Indian rupee (INR)" },
            { value: "AED", label: "UAE dirham (AED)" },
          ]}
        />
      </Section>

      <Section
        title="Virtual try-on"
        help="The wording shown in the try-on studio. Nothing about a visitor's camera ever leaves their device — this is what tells them so."
      >
        <TextInput
          label="Camera screen heading"
          value={v.camera_permission_title}
          onChange={(x) => set("camera_permission_title", x)}
          max={60}
        />
        <TextArea
          label="Camera screen explanation"
          value={v.camera_permission_body}
          onChange={(x) => set("camera_permission_body", x)}
          rows={4}
          max={400}
        />
        <TextArea
          label="Colour disclaimer"
          help="A short line reminding people that screens vary."
          value={v.try_on_disclaimer}
          onChange={(x) => set("try_on_disclaimer", x)}
          rows={2}
          max={200}
        />
      </Section>

      <SaveBar
        dirty={editor.dirty}
        state={editor.state}
        error={editor.error}
        onSave={onSave}
        viewHref="/"
      />
    </div>
  );
}

function Section({
  title,
  help,
  children,
}: {
  title: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10 border-b border-line pb-10 last:border-0">
      <h2 className="font-[family-name:var(--font-display)] text-xl">{title}</h2>
      {help ? <p className="mt-1.5 mb-5 text-sm text-ink-muted">{help}</p> : <div className="mb-5" />}
      <div className="space-y-6">{children}</div>
    </section>
  );
}
