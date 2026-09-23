import type { Json } from "@/lib/types/database";

/**
 * Safe readers for the jsonb in `sections.content`.
 *
 * Content is authored by non-technical editors, so every field is treated as
 * possibly missing, possibly the wrong type, possibly an empty string. These
 * helpers always return null rather than throwing or rendering "undefined",
 * which is what lets sections degrade gracefully (CLAUDE.md).
 */

export type Obj = Record<string, Json | undefined>;

export function obj(value: Json | undefined | null): Obj {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Obj) : {};
}

/** A non-empty trimmed string, or null. */
export function text(value: Json | undefined | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function num(value: Json | undefined | null): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

export type Media = { url: string; alt: string; type: "image" | "video"; posterUrl: string | null };

/** An image or video, or null when no URL has been set. */
export function media(value: Json | undefined | null): Media | null {
  const m = obj(value);
  const url = text(m.url);
  if (!url) return null;
  const declared = text(m.type);
  const type = declared === "video" || /\.(mp4|webm)$/i.test(url) ? "video" : "image";
  return { url, alt: text(m.alt) ?? "", type, posterUrl: text(m.poster_url) };
}

export type Link = { label: string; href: string };

/** A link, or null unless BOTH a label and a destination exist. */
export function link(value: Json | undefined | null): Link | null {
  const l = obj(value);
  const label = text(l.label);
  const href = text(l.href);
  return label && href ? { label, href } : null;
}

/** Links from an array field, skipping any incomplete entry. */
export function links(value: Json | undefined | null): Link[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => link(entry)).filter((l): l is Link => l !== null);
}

/**
 * The same list, but keeping half-finished rows — for the admin panel only.
 *
 * `links()` drops an entry missing either half, which is right for the site:
 * a menu item that goes nowhere should not render. It was also what the
 * settings form seeded itself with, so a row saved with an empty address
 * disappeared from the panel on reload, and the next save wrote the shortened
 * list back — quietly destroying the editor's work. The editor has to be able
 * to see a row in order to finish it.
 */
export function linksForEditing(value: Json | undefined | null): Link[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const l = obj(entry);
      return { label: text(l.label) ?? "", href: text(l.href) ?? "" };
    })
    .filter((l) => l.label !== "" || l.href !== "");
}

export type CraftItem = { title: string | null; description: string | null };

/** List items that have at least a title or a description. */
export function listItems(value: Json | undefined | null): CraftItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const item = obj(entry);
      return { title: text(item.title), description: text(item.description) };
    })
    .filter((item) => item.title !== null || item.description !== null);
}

export type GalleryImage = { url: string; alt: string };

/** Product gallery images, skipping entries with no URL. */
export function gallery(value: Json | undefined | null): GalleryImage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const image = obj(entry);
      const url = text(image.url);
      return url ? { url, alt: text(image.alt) ?? "" } : null;
    })
    .filter((image): image is GalleryImage => image !== null);
}

export type FooterColumn = { title: string | null; links: Link[] };

export function footerColumns(value: Json | undefined | null): FooterColumn[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const column = obj(entry);
      return { title: text(column.title), links: links(column.links) };
    })
    .filter((column) => column.links.length > 0 || column.title !== null);
}

/** Footer columns for the admin panel, keeping half-finished rows. */
export function footerColumnsForEditing(value: Json | undefined | null): FooterColumn[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const column = obj(entry);
      return { title: text(column.title), links: linksForEditing(column.links) };
    })
    .filter((column) => column.links.length > 0 || column.title !== null);
}

export type SocialLink = { label: string; url: string };

export function socialLinks(value: Json | undefined | null): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const s = obj(entry);
      const label = text(s.label);
      const url = text(s.url);
      return label && url ? { label, url } : null;
    })
    .filter((s): s is SocialLink => s !== null);
}
