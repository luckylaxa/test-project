import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { tags } from "@/lib/cache-tags";
import type { Database } from "@/lib/types/database";

type Tables = Database["public"]["Tables"];
export type SiteSettings = Tables["site_settings"]["Row"];
export type PageRow = Tables["pages"]["Row"];
export type SectionRow = Tables["sections"]["Row"];
export type CollectionRow = Tables["collections"]["Row"];
export type ProductRow = Tables["products"]["Row"];
export type ShadeRow = Tables["shades"]["Row"];
export type LookRow = Tables["looks"]["Row"];
export type JournalRow = Tables["journal_posts"]["Row"];
export type TestimonialRow = Tables["testimonials"]["Row"];
export type PressRow = Tables["press_logos"]["Row"];
export type TryOnModelRow = Tables["try_on_models"]["Row"];
export type ProductCategory = Database["public"]["Enums"]["product_category"];

export type ProductWithShades = ProductRow & { shades: ShadeRow[] };
export type CollectionWithProducts = CollectionRow & { products: ProductWithShades[] };
export type LookWithItems = LookRow & {
  items: { id: string; intensity: number | null; shade: ShadeRow; product: ProductRow }[];
};

/**
 * All loaders below are `use cache` so public pages prerender.
 * Each tags its result, letting the admin panel invalidate precisely what changed.
 * RLS means the anonymous client only ever sees visible/published rows, so a
 * hidden product cannot leak into a cached page.
 */

export async function getSiteSettings(): Promise<SiteSettings | null> {
  "use cache";
  cacheTag(tags.settings);
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return data ?? null;
}

export async function getPage(slug: string): Promise<{ page: PageRow; sections: SectionRow[] } | null> {
  "use cache";
  cacheTag(tags.pages, tags.page(slug));
  cacheLife("days");

  const supabase = createPublicClient();
  const { data: page } = await supabase.from("pages").select("*").eq("slug", slug).maybeSingle();
  if (!page) return null;

  const { data: sections } = await supabase
    .from("sections")
    .select("*")
    .eq("page_id", page.id)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  return { page, sections: sections ?? [] };
}

export async function getPageSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(tags.pages);
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase.from("pages").select("slug");
  return (data ?? []).map((row) => row.slug);
}

export async function getCollections(): Promise<CollectionRow[]> {
  "use cache";
  cacheTag(tags.collections);
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("collections")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getCollection(slug: string): Promise<CollectionWithProducts | null> {
  "use cache";
  cacheTag(tags.collections, tags.collection(slug), tags.products, tags.shades);
  cacheLife("days");

  const supabase = createPublicClient();
  const { data: collection } = await supabase
    .from("collections")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!collection) return null;

  const { data: products } = await supabase
    .from("products")
    .select("*, shades(*)")
    .eq("collection_id", collection.id)
    .order("sort_order", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "shades" });

  return { ...collection, products: (products as ProductWithShades[] | null) ?? [] };
}

export async function getProducts(): Promise<ProductWithShades[]> {
  "use cache";
  cacheTag(tags.products, tags.shades);
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("*, shades(*)")
    .order("sort_order", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "shades" });
  return (data as ProductWithShades[] | null) ?? [];
}

export async function getBestsellers(limit: number | null): Promise<ProductWithShades[]> {
  "use cache";
  cacheTag(tags.products, tags.shades);
  cacheLife("days");

  const supabase = createPublicClient();
  let query = supabase
    .from("products")
    .select("*, shades(*)")
    .eq("is_bestseller", true)
    .order("sort_order", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "shades" });
  if (limit && limit > 0) query = query.limit(limit);

  const { data } = await query;
  return (data as ProductWithShades[] | null) ?? [];
}

export type ProductDetail = ProductWithShades & {
  collection: CollectionRow | null;
  /**
   * With their shades. A related card renders the same `ProductCard` as every
   * other grid, and that card's Add button adds immediately when a product has
   * no shades — so handing it a shadeless product put a multi-shade lipstick in
   * the basket with no shade chosen, which checkout then accepted.
   */
  related: ProductWithShades[];
};

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheTag(tags.products, tags.product(slug), tags.shades, tags.collections);
  cacheLife("days");

  const supabase = createPublicClient();
  const { data: product } = await supabase
    .from("products")
    .select("*, shades(*), collection:collections(*)")
    .eq("slug", slug)
    .order("sort_order", { ascending: true, referencedTable: "shades" })
    .maybeSingle();
  if (!product) return null;

  const { data: relatedRows } = await supabase
    .from("product_related")
    .select("sort_order, related:products!product_related_related_product_id_fkey(*, shades(*))")
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true });

  const related = (relatedRows ?? [])
    .map((row) => row.related as unknown as ProductWithShades | null)
    .filter((row): row is ProductWithShades => row !== null);

  return { ...(product as unknown as ProductWithShades & { collection: CollectionRow | null }), related };
}

export async function getProductSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(tags.products);
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase.from("products").select("slug");
  return (data ?? []).map((row) => row.slug);
}

export async function getLooks(): Promise<LookRow[]> {
  "use cache";
  cacheTag(tags.looks);
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase.from("looks").select("*").order("sort_order", { ascending: true });
  return data ?? [];
}

/** Looks with their shades resolved, used by both the looks page and the studio. */
export async function getLooksWithItems(): Promise<LookWithItems[]> {
  "use cache";
  cacheTag(tags.looks, tags.shades, tags.products);
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("looks")
    .select("*, look_items(id, intensity, sort_order, shade:shades(*, product:products(*)))")
    .order("sort_order", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "look_items" });

  type RawItem = {
    id: string;
    intensity: number | null;
    sort_order: number;
    shade: (ShadeRow & { product: ProductRow | null }) | null;
  };
  type RawLook = LookRow & { look_items: RawItem[] | null };

  return ((data as RawLook[] | null) ?? []).map((look) => {
    const { look_items, ...rest } = look;
    const items = (look_items ?? [])
      .map((item) => {
        if (!item.shade?.product) return null;
        const { product, ...shade } = item.shade;
        return { id: item.id, intensity: item.intensity, shade: shade as ShadeRow, product };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
    return { ...rest, items };
  });
}

export async function getJournalPosts(): Promise<JournalRow[]> {
  "use cache";
  cacheTag(tags.journal);
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("journal_posts")
    .select("*")
    .order("published_at", { ascending: false });
  return data ?? [];
}

export async function getJournalPost(slug: string): Promise<JournalRow | null> {
  "use cache";
  cacheTag(tags.journal, tags.journalPost(slug));
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase.from("journal_posts").select("*").eq("slug", slug).maybeSingle();
  return data ?? null;
}

export async function getJournalSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(tags.journal);
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase.from("journal_posts").select("slug");
  return (data ?? []).map((row) => row.slug);
}

export async function getTestimonials(): Promise<TestimonialRow[]> {
  "use cache";
  cacheTag(tags.testimonials);
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getPressLogos(): Promise<PressRow[]> {
  "use cache";
  cacheTag(tags.press);
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("press_logos")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getTryOnModels(): Promise<TryOnModelRow[]> {
  "use cache";
  cacheTag(tags.tryOnModels);
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("try_on_models")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []).filter((model) => model.photo_url);
}

/**
 * Cache Components requires generateStaticParams to return at least one param.
 * A brand-new site with no products yet would otherwise fail the build, so we
 * fall back to a sentinel slug. No row can match it, so the route renders the
 * 404 shell until real content exists.
 */
export const EMPTY_SLUG = "__none";

export function slugParams(slugs: string[]): { slug: string }[] {
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: EMPTY_SLUG }];
}

/**
 * The copyright year, cached so it does not block prerendering.
 * `new Date()` read during render makes a page dynamic; caching it for a day
 * keeps every page static and still rolls over on time.
 */
export async function getCopyrightYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
