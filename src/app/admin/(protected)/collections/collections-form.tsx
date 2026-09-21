"use client";

import { RowsEditor } from "@/components/admin/rows-editor";
import { TextArea, TextInput, Toggle } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-field";
import { saveRows } from "@/lib/admin/rows-actions";
import type { CollectionRow } from "@/lib/content";

type Draft = {
  key: string;
  id?: string;
  name: string;
  slug: string;
  description: string;
  hero: { url: string; alt: string };
  seo_title: string;
  seo_description: string;
  is_visible: boolean;
};

export function CollectionsForm({ collections }: { collections: CollectionRow[] }) {
  return (
    <RowsEditor<Draft>
      initial={collections.map((c) => ({
        key: c.id,
        id: c.id,
        name: c.name ?? "",
        slug: c.slug,
        description: c.description ?? "",
        hero: { url: c.hero_image_url ?? "", alt: c.hero_image_alt ?? "" },
        seo_title: c.seo_title ?? "",
        seo_description: c.seo_description ?? "",
        is_visible: c.is_visible,
      }))}
      blank={() => ({
        key: crypto.randomUUID(),
        name: "",
        slug: "",
        description: "",
        hero: { url: "", alt: "" },
        seo_title: "",
        seo_description: "",
        is_visible: false,
      })}
      summary={(row) => ({
        title: row.name,
        meta: `/collections/${row.slug}${row.is_visible ? "" : " · hidden"}`,
        image: row.hero.url || undefined,
      })}
      addLabel="Add a collection"
      emptyLabel="No collections yet."
      viewHref="/collections"
      onSave={(rows) =>
        saveRows(
          "collections",
          rows.map((row) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description || null,
            hero_image_url: row.hero.url || null,
            hero_image_alt: row.hero.alt || null,
            seo_title: row.seo_title || null,
            seo_description: row.seo_description || null,
            is_visible: row.is_visible,
          })),
        )
      }
      renderRow={(row, update) => (
        <>
          <TextInput label="Name" value={row.name} onChange={(x) => update({ name: x })} max={60} />
          <TextInput
            label="Web address"
            help="The part after /collections/. Changing it breaks existing links."
            value={row.slug}
            onChange={(x) => update({ slug: x.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
            max={60}
          />
          <TextArea
            label="Description"
            help="A sentence or two, shown on the collection card and at the top of its page."
            value={row.description}
            onChange={(x) => update({ description: x })}
            max={280}
            rows={3}
          />
          <MediaField
            label="Cover image"
            help="Used full width at the top of the collection page."
            value={row.hero}
            onChange={(x) => update({ hero: x })}
          />
          <TextInput
            label="Page title for search engines"
            help="Leave empty to use the collection name."
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
            label="Show on the website"
            checked={row.is_visible}
            onChange={(x) => update({ is_visible: x })}
          />
        </>
      )}
    />
  );
}
