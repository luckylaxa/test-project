"use client";

import { RowsEditor } from "@/components/admin/rows-editor";
import { TextArea, TextInput, Toggle } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-field";
import { RichText } from "@/components/admin/rich-text";
import type { JournalRow } from "@/lib/content";
import { saveposts } from "./actions";

type Draft = {
  key: string;
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  cover: { url: string; alt: string };
  body_html: string;
  published_on: string;
  seo_title: string;
  seo_description: string;
  is_published: boolean;
};

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

export function JournalForm({ posts }: { posts: JournalRow[] }) {
  return (
    <RowsEditor<Draft>
      initial={posts.map((p) => ({
        key: p.id,
        id: p.id,
        title: p.title ?? "",
        slug: p.slug,
        excerpt: p.excerpt ?? "",
        cover: { url: p.cover_image_url ?? "", alt: p.cover_image_alt ?? "" },
        body_html: p.body_html ?? "",
        published_on: toDateInput(p.published_at),
        seo_title: p.seo_title ?? "",
        seo_description: p.seo_description ?? "",
        is_published: p.is_published,
      }))}
      blank={() => ({
        key: crypto.randomUUID(),
        title: "",
        slug: "",
        excerpt: "",
        cover: { url: "", alt: "" },
        body_html: "",
        published_on: new Date().toISOString().slice(0, 10),
        seo_title: "",
        seo_description: "",
        is_published: false,
      })}
      summary={(row) => ({
        title: row.title,
        meta: `${row.published_on || "no date"}${row.is_published ? "" : " · draft"}`,
        image: row.cover.url || undefined,
      })}
      addLabel="Write an article"
      emptyLabel="No articles yet."
      viewHref="/journal"
      onSave={(rows) =>
        saveposts(
          rows.map((row) => ({
            id: row.id,
            title: row.title,
            slug: row.slug,
            excerpt: row.excerpt || null,
            cover_image_url: row.cover.url || null,
            cover_image_alt: row.cover.alt || null,
            body_html: row.body_html,
            // Stored as a timestamp; an article with no date never goes public.
            published_at: row.published_on ? new Date(row.published_on).toISOString() : null,
            seo_title: row.seo_title || null,
            seo_description: row.seo_description || null,
            is_published: row.is_published,
          })),
        )
      }
      renderRow={(row, update) => (
        <>
          <TextInput label="Title" value={row.title} onChange={(x) => update({ title: x })} max={90} />
          <TextInput
            label="Web address"
            help="The part after /journal/."
            value={row.slug}
            onChange={(x) => update({ slug: x.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
            max={80}
          />
          <TextArea
            label="Standfirst"
            help="One or two sentences, shown under the title and on the journal list."
            value={row.excerpt}
            onChange={(x) => update({ excerpt: x })}
            max={220}
            rows={3}
          />
          <MediaField label="Cover image" value={row.cover} onChange={(x) => update({ cover: x })} />
          <RichText
            label="Article"
            help="Use the large heading for sections within the article. The title above is the main heading."
            value={row.body_html}
            onChange={(x) => update({ body_html: x })}
          />
          <TextInput
            label="Date"
            help="Shown on the article and used to order the journal."
            value={row.published_on}
            onChange={(x) => update({ published_on: x })}
            type="date"
          />
          <TextInput
            label="Page title for search engines"
            help="Leave empty to use the article title."
            value={row.seo_title}
            onChange={(x) => update({ seo_title: x })}
            max={60}
          />
          <TextArea
            label="Description for search engines"
            value={row.seo_description}
            onChange={(x) => update({ seo_description: x })}
            max={160}
            rows={2}
          />
          <Toggle
            label="Published"
            help="Drafts are never visible on the website, even with a date in the past."
            checked={row.is_published}
            onChange={(x) => update({ is_published: x })}
          />
        </>
      )}
    />
  );
}
