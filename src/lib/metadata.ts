import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/content";

/** Absolute site origin, used for canonical URLs and Open Graph images. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

function absolute(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${siteUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Builds page metadata from Supabase, falling back to site_settings for
 * anything the editor left blank. No SEO text is hardcoded.
 */
export async function buildMetadata({
  title,
  description,
  image,
  path,
}: {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  path?: string;
}): Promise<Metadata> {
  const settings = await getSiteSettings();
  const brand = settings?.brand_name || "";

  const resolvedTitle = title || settings?.seo_title || brand || undefined;
  const resolvedDescription = description || settings?.seo_description || undefined;
  const resolvedImage = absolute(image || settings?.seo_og_image_url);
  const url = `${siteUrl()}${path ?? ""}`;

  return {
    metadataBase: new URL(siteUrl()),
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: { canonical: url },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url,
      siteName: brand || undefined,
      type: "website",
      images: resolvedImage ? [{ url: resolvedImage }] : undefined,
    },
    twitter: {
      card: resolvedImage ? "summary_large_image" : "summary",
      title: resolvedTitle,
      description: resolvedDescription,
      images: resolvedImage ? [resolvedImage] : undefined,
    },
    icons: settings?.favicon_url ? { icon: settings.favicon_url } : undefined,
  };
}
