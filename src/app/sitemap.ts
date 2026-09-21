import type { MetadataRoute } from "next";
import {
  getCollections,
  getJournalPosts,
  getPageSlugs,
  getProducts,
} from "@/lib/content";
import { siteUrl } from "@/lib/metadata";

/** Only published, visible content reaches here — RLS guarantees it. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [pageSlugs, collections, products, posts] = await Promise.all([
    getPageSlugs(),
    getCollections(),
    getProducts(),
    getJournalPosts(),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/try-on`, priority: 0.9 },
  ];

  for (const slug of pageSlugs) {
    if (slug === "home") continue;
    entries.push({ url: `${base}/${slug}`, priority: 0.6 });
  }
  for (const collection of collections) {
    entries.push({
      url: `${base}/collections/${collection.slug}`,
      lastModified: collection.updated_at,
      priority: 0.8,
    });
  }
  for (const product of products) {
    entries.push({
      url: `${base}/products/${product.slug}`,
      lastModified: product.updated_at,
      priority: 0.8,
    });
  }
  for (const post of posts) {
    entries.push({
      url: `${base}/journal/${post.slug}`,
      lastModified: post.updated_at,
      priority: 0.5,
    });
  }

  return entries;
}
