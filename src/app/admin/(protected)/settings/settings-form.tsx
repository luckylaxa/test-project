"use client";

import { ColorField, Select, TextArea, TextInput, Toggle } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-field";
import { SaveBar, useEditor } from "@/components/admin/save-bar";
import { RepeaterLinks, RepeaterFooter } from "@/components/admin/repeaters";
import type { SiteSettings } from "@/lib/content";
import { footerColumns, links, obj, socialLinks, text } from "@/lib/section-content";
import { LABEL_FALLBACKS } from "@/lib/labels";
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
  google_login_enabled: boolean;
  labels: Record<string, string>;
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
    google_login_enabled: settings.google_login_enabled ?? false,
    labels: readLabels(settings.ui_labels),
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
        google_login_enabled: form.google_login_enabled,
        // Only real overrides are stored, so clearing a field restores the
        // wording the site ships with rather than blanking the button.
        ui_labels: Object.fromEntries(
          Object.entries(form.labels).filter(([, value]) => value.trim() !== ""),
        ),
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
        help="Customers sign in before paying so their order can be delivered. Payment itself is handled by Stripe on their own secure page — card details never reach this website."
      >
        <Toggle
          label="Let customers sign in with Google"
          help="Turn this on only after the Google provider has been switched on in Supabase. Until then the button sends customers to an error page they cannot get back from."
          checked={v.google_login_enabled}
          onChange={(x) => set("google_login_enabled", x)}
        />
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

      <Section
        title="Wording"
        help="The short pieces of text the site reuses — buttons, empty states and form labels. Leave a field empty to keep the wording shown in grey."
      >
        {LABEL_GROUPS.map((group) => (
          <div key={group.title} className="space-y-6">
            <h3 className="text-[0.6875rem] tracking-[0.16em] text-ink-muted uppercase">
              {group.title}
            </h3>
            {group.keys.map((key) => {
              const fallback = LABEL_FALLBACKS[key] ?? "";
              const common = {
                label: LABEL_NAMES[key] ?? key,
                value: v.labels[key] ?? "",
                placeholder: fallback,
                onChange: (x: string) => set("labels", { ...v.labels, [key]: x }),
              };
              return fallback.length > 60 ? (
                <TextArea key={key} {...common} rows={3} max={400} />
              ) : (
                <TextInput key={key} {...common} max={120} />
              );
            })}
          </div>
        ))}
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

/** Existing overrides, as plain strings the form can edit. */
function readLabels(stored: SiteSettings["ui_labels"]): Record<string, string> {
  const raw = obj(stored);
  const out: Record<string, string> = {};
  for (const key of Object.keys(LABEL_FALLBACKS)) out[key] = text(raw[key]) ?? "";
  return out;
}

/**
 * Editor-facing names for the label keys. Panel chrome, so these stay in code.
 * Any key missing from a group still saves — it just shows under "Other".
 */
const LABEL_NAMES: Record<string, string> = {
  try_on_look: "Try this look",
  try_on_shade: "Try this shade",
  product_details: "Details heading",
  product_ingredients: "Ingredients heading",
  product_how_to_apply: "How to apply heading",
  complete_the_look: "Complete the look heading",
  choose_shade: "Shade picker label",
  filter_all: "Filter: all",
  filter_category: "Filter: category",
  filter_finish: "Filter: finish",
  read_article: "Read the article",
  view_product: "View product",
  shades_in_look: "Shades in this look",
  no_products: "No products",
  no_results: "No filter results",
  empty_journal: "Journal is empty",
  empty_looks: "Looks are empty",
  try_on_start_camera: "Use my camera",
  try_on_upload: "Upload a photo",
  try_on_models: "Or try a model",
  try_on_camera_denied: "Camera unavailable",
  try_on_products: "Products & shades",
  try_on_close: "Close",
  try_on_compare: "Hold to compare",
  try_on_snapshot: "Save image",
  try_on_loading: "Preparing the studio",
  try_on_searching: "Looking for a face",
  try_on_error: "Studio error",
  try_on_none_applied: "Nothing applied yet",
  try_on_clear: "Clear all",
  try_on_intensity: "Intensity",
  try_on_looks_tab: "Looks tab",
  try_on_empty_category: "Empty category",
  not_found_eyebrow: "404 eyebrow",
  not_found_title: "404 heading",
  not_found_body: "404 text",
  not_found_button: "404 button",
  skip_to_content: "Skip to content",
  menu_open: "Open menu",
  menu_close: "Close menu",
  nav_primary_label: "Main navigation (screen readers)",
  footer_contact_title: "Footer contact heading",
  try_on_canvas_label: "Try-on preview (screen readers)",
  form_error_send: "Could not send a form",
  form_error_save: "Could not save a form",
  cart_title: "Basket heading",
  cart_button: "Basket button",
  cart_empty: "Basket is empty",
  cart_subtotal: "Subtotal",
  cart_checkout: "Go to checkout",
  cart_continue: "Continue shopping",
  cart_remove: "Remove",
  cart_close: "Close basket",
  cart_unavailable: "Item unavailable",
  cart_note: "Basket footnote",
  add_to_cart: "Add to basket",
  checkout_complete_title: "Order complete heading",
  checkout_complete_body: "Order complete text",
  checkout_complete_button: "Order complete button",
  checkout_cancelled_title: "Checkout cancelled heading",
  checkout_cancelled_body: "Checkout cancelled text",
  checkout_cancelled_button: "Checkout cancelled button",
  account_title: "Account heading",
  account_signin_title: "Sign in heading",
  account_signup_title: "Register heading",
  account_signin_cta: "Sign in button",
  account_signup_cta: "Register button",
  account_switch_to_signup: "Switch to register",
  account_switch_to_signin: "Switch to sign in",
  account_signout: "Sign out",
  account_delivery_title: "Delivery address heading",
  account_delivery_help: "Delivery address explanation",
  account_saved: "Saved confirmation",
  account_check_email: "Confirm your email",
  account_email: "Email field",
  account_password: "Password field",
  account_password_help: "Password hint",
  account_save: "Save button",
  account_field_full_name: "Full name field",
  account_field_phone: "Telephone field",
  account_field_address1: "Address field",
  account_field_address2: "Address line 2 field",
  account_field_city: "City field",
  account_field_postcode: "Postcode field",
  account_field_country: "Country field",
  account_field_country_empty: "Country placeholder",
  account_error_credentials: "Wrong email or password",
  account_error_email_taken: "Email already registered",
  account_error_email_invalid: "Email not valid",
  account_error_weak_password: "Password too short",
  account_error_rate_limited: "Too many attempts",
  account_error_network: "Could not reach the server",
  account_error_generic: "Something went wrong",
  account_google: "Google sign-in button",
  account_or: "Divider between Google and email",
  account_error_oauth: "Google sign-in failed",
  account_error_signed_out: "Session expired",
  account_error_country: "Country not chosen",
  checkout_signin_required: "Sign in needed for checkout",
  checkout_address_required: "Address needed for checkout",
  checkout_go_to_account: "Go to your account",
};

const GROUPED: { title: string; keys: string[] }[] = [
  {
    title: "Buttons and links",
    keys: [
      "try_on_look", "try_on_shade", "read_article", "view_product",
      "add_to_cart", "choose_shade", "shades_in_look",
    ],
  },
  {
    title: "Product and collection pages",
    keys: [
      "product_details", "product_ingredients", "product_how_to_apply",
      "complete_the_look", "filter_all", "filter_category", "filter_finish",
    ],
  },
  {
    title: "When there is nothing to show",
    keys: ["no_products", "no_results", "empty_journal", "empty_looks",
           "not_found_eyebrow", "not_found_title", "not_found_body", "not_found_button"],
  },
  {
    title: "Virtual try-on",
    keys: [
      "try_on_start_camera", "try_on_upload", "try_on_models", "try_on_camera_denied",
      "try_on_products", "try_on_looks_tab", "try_on_close", "try_on_compare",
      "try_on_snapshot", "try_on_loading", "try_on_searching", "try_on_error",
      "try_on_none_applied", "try_on_clear", "try_on_intensity", "try_on_empty_category",
    ],
  },
  {
    title: "Basket and checkout",
    keys: [
      "cart_title", "cart_button", "cart_empty", "cart_subtotal", "cart_checkout",
      "cart_continue", "cart_remove", "cart_close", "cart_unavailable", "cart_note",
      "checkout_complete_title", "checkout_complete_body", "checkout_complete_button",
      "checkout_cancelled_title", "checkout_cancelled_body", "checkout_cancelled_button",
      "checkout_signin_required", "checkout_address_required", "checkout_go_to_account",
    ],
  },
  {
    title: "Customer accounts",
    keys: [
      "account_title", "account_signin_title", "account_signup_title",
      "account_signin_cta", "account_signup_cta", "account_switch_to_signup",
      "account_switch_to_signin", "account_signout", "account_email",
      "account_password", "account_password_help", "account_check_email",
      "account_delivery_title", "account_delivery_help", "account_field_full_name",
      "account_field_phone", "account_field_address1", "account_field_address2",
      "account_field_city", "account_field_postcode", "account_field_country",
      "account_field_country_empty", "account_save", "account_saved",
      "account_error_credentials", "account_error_email_taken",
      "account_error_email_invalid", "account_error_weak_password",
      "account_error_rate_limited", "account_error_network", "account_error_generic",
      "account_google", "account_or", "account_error_oauth",
      "account_error_signed_out", "account_error_country",
    ],
  },
  {
    title: "Navigation and screen readers",
    keys: ["skip_to_content", "menu_open", "menu_close", "nav_primary_label",
           "footer_contact_title", "try_on_canvas_label", "form_error_send", "form_error_save"],
  },
];

/**
 * Every group, plus anything added to the fallbacks since — a new label is
 * still editable without anyone remembering to list it here.
 */
const LABEL_GROUPS: { title: string; keys: string[] }[] = (() => {
  const placed = new Set(GROUPED.flatMap((g) => g.keys));
  const rest = Object.keys(LABEL_FALLBACKS).filter((k) => !placed.has(k));
  return rest.length > 0 ? [...GROUPED, { title: "Other", keys: rest }] : GROUPED;
})();
