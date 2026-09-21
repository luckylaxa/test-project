/**
 * Cache tags for on-demand revalidation.
 * Every content loader tags its result; saving in the admin panel revalidates
 * the matching tags so the public site updates within seconds (Phase 6).
 */
export const tags = {
  settings: "settings",
  pages: "pages",
  page: (slug: string) => `page:${slug}`,
  collections: "collections",
  collection: (slug: string) => `collection:${slug}`,
  products: "products",
  product: (slug: string) => `product:${slug}`,
  shades: "shades",
  looks: "looks",
  look: (slug: string) => `look:${slug}`,
  journal: "journal",
  journalPost: (slug: string) => `journal:${slug}`,
  testimonials: "testimonials",
  press: "press",
  tryOnModels: "try-on-models",
} as const;

/** Everything the try-on studio reads, so one save refreshes the whole studio. */
export const TRY_ON_TAGS = [tags.products, tags.shades, tags.looks, tags.tryOnModels];
