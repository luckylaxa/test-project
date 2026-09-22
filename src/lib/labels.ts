import type { SiteSettings } from "@/lib/content";
import { obj, text } from "@/lib/section-content";

/**
 * Small recurring UI strings, all editable in Site Settings.
 * Falls back to the key's own default only when an editor has cleared the field,
 * so the site never renders a blank button.
 */
export type Labels = ReturnType<typeof makeLabels>;

const FALLBACKS: Record<string, string> = {
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
};

export function makeLabels(settings: SiteSettings | null) {
  const ui = obj(settings?.ui_labels);
  const categories = obj(settings?.category_labels);
  const finishes = obj(settings?.finish_labels);

  return {
    /** A UI string by key. */
    t(key: keyof typeof FALLBACKS | string): string {
      return text(ui[key]) ?? FALLBACKS[key] ?? "";
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
