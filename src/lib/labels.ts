import type { SiteSettings } from "@/lib/content";
import { obj, text } from "@/lib/section-content";

/**
 * Small recurring UI strings, all editable in Site Settings.
 * Falls back to the key's own default only when an editor has cleared the field,
 * so the site never renders a blank button.
 */
export type Labels = ReturnType<typeof makeLabels>;

export const LABEL_FALLBACKS: Record<string, string> = {
  try_on_look: "Try This Look",
  try_on_shade: "Try This Shade",
  product_details: "Details",
  product_ingredients: "Ingredients",
  product_how_to_apply: "How to Apply",
  complete_the_look: "Complete the Look",
  choose_shade: "Shade",
  filter_all: "All",
  filter_category: "Category",
  filter_finish: "Finish",
  read_article: "Read the article",
  view_product: "View product",
  shades_in_look: "Shades in this look",
  no_products: "Nothing to show here yet.",
  no_results: "No products match these filters.",
  empty_journal: "The first article is on its way.",
  empty_looks: "Curated looks are on their way.",

  // Try-on studio
  try_on_start_camera: "Use my camera",
  try_on_upload: "Upload a photo",
  try_on_models: "Or try a model",
  try_on_camera_denied:
    "We could not reach your camera. You can still upload a photo or choose a model below.",
  try_on_products: "Products & shades",
  try_on_close: "Close",
  try_on_compare: "Hold to compare",
  try_on_snapshot: "Save image",
  try_on_loading: "Preparing the studio",
  try_on_searching: "Looking for your face",
  try_on_error: "Something went wrong. Try another photo or reload the page.",
  try_on_none_applied: "Choose a shade to begin.",
  try_on_clear: "Clear all",
  try_on_intensity: "intensity",
  try_on_looks_tab: "Looks",
  try_on_empty_category: "No products in this category yet.",

  // Page not found
  not_found_eyebrow: "404",
  not_found_title: "This page has moved on.",
  not_found_body:
    "The page you were looking for is no longer here. The collections are, though.",
  not_found_button: "Return home",

  // Chrome a visitor can encounter, including what a screen reader reads aloud
  skip_to_content: "Skip to content",
  menu_open: "Open menu",
  menu_close: "Close menu",
  nav_primary_label: "Primary",
  footer_contact_title: "Contact",
  try_on_canvas_label: "Virtual try-on preview",
  form_error_send: "We could not send that just now. Please try again, or email us directly.",
  form_error_save: "We could not save that just now. Please try again.",

  // Basket and checkout
  cart_title: "Your basket",
  cart_button: "Basket",
  cart_empty: "Your basket is empty.",
  cart_subtotal: "Subtotal",
  cart_checkout: "Go to checkout",
  cart_continue: "Continue shopping",
  cart_remove: "Remove",
  cart_close: "Close",
  cart_unavailable: "This item is no longer available",
  cart_note:
    "Taxes and delivery are calculated at checkout. Payment is handled securely by Stripe.",
  add_to_cart: "Add to basket",
  checkout_complete_title: "Thank you.",
  checkout_complete_body:
    "Your order is confirmed and a receipt is on its way to your email.",
  checkout_complete_button: "Continue shopping",
  checkout_cancelled_title: "Your basket is still here.",
  checkout_cancelled_body:
    "Nothing has been charged. Pick up where you left off whenever you are ready.",
  checkout_cancelled_button: "Back to the collection",

  // Customer accounts
  account_title: "Your account",
  account_signin_title: "Sign in",
  account_signup_title: "Create an account",
  account_signin_cta: "Sign in",
  account_signup_cta: "Create account",
  account_switch_to_signup: "New here? Create an account",
  account_switch_to_signin: "Already have an account? Sign in",
  account_signout: "Sign out",
  account_delivery_title: "Delivery address",
  account_delivery_help:
    "We need this to send your order. Only you and the maison can see it.",
  account_saved: "Saved.",
  account_check_email: "Check your inbox to confirm your email address, then sign in.",
  checkout_signin_required:
    "Please sign in or create an account so we can deliver your order.",
  checkout_address_required: "Please add a delivery address before checking out.",
  checkout_go_to_account: "Go to your account",
  account_email: "Email",
  account_password: "Password",
  account_password_help: "At least eight characters.",

  // What a customer is told when signing in or registering fails. Mapped from
  // the provider's error codes so the maison's own wording is what they read.
  account_error_credentials: "That email and password did not match.",
  account_error_email_taken: "There is already an account with that email. Try signing in.",
  account_error_email_invalid: "That does not look like an email address we can deliver to.",
  account_error_weak_password: "Please choose a longer password — at least eight characters.",
  account_error_rate_limited:
    "Too many attempts just now. Please wait a few minutes and try again.",
  account_error_network: "We could not reach the server. Check your connection and try again.",
  account_error_generic: "We could not do that just now. Please try again.",

  // Delivery address form
  account_field_full_name: "Full name",
  account_field_phone: "Telephone",
  account_field_address1: "Address",
  account_field_address2: "Address line 2",
  account_field_city: "City",
  account_field_postcode: "Postcode",
  account_field_country: "Country",
  account_field_country_empty: "Select a country",
  account_save: "Save",
};

export function makeLabels(settings: SiteSettings | null) {
  const ui = obj(settings?.ui_labels);
  const categories = obj(settings?.category_labels);
  const finishes = obj(settings?.finish_labels);

  return {
    /** A UI string by key. */
    t(key: keyof typeof LABEL_FALLBACKS | string): string {
      return text(ui[key]) ?? LABEL_FALLBACKS[key] ?? "";
    },
    /** Display name for a product category. */
    category(value: string): string {
      return text(categories[value]) ?? value;
    },
    /** Display name for a shade finish. */
    finish(value: string): string {
      return text(finishes[value]) ?? value;
    },
  };
}
