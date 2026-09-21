"use client";

import { RowsEditor } from "@/components/admin/rows-editor";
import { TextArea, TextInput, Toggle } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-field";
import { saveRows } from "@/lib/admin/rows-actions";
import type { TestimonialRow } from "@/lib/content";

type Draft = {
  key: string;
  id?: string;
  quote: string;
  author_name: string;
  author_role: string;
  image: { url: string; alt: string };
  is_visible: boolean;
};

export function TestimonialsForm({ testimonials }: { testimonials: TestimonialRow[] }) {
  return (
    <RowsEditor<Draft>
      initial={testimonials.map((t) => ({
        key: t.id,
        id: t.id,
        quote: t.quote ?? "",
        author_name: t.author_name ?? "",
        author_role: t.author_role ?? "",
        image: { url: t.image_url ?? "", alt: t.image_alt ?? "" },
        is_visible: t.is_visible,
      }))}
      blank={() => ({
        key: crypto.randomUUID(),
        quote: "",
        author_name: "",
        author_role: "",
        image: { url: "", alt: "" },
        is_visible: true,
      })}
      summary={(row) => ({
        title: row.quote.slice(0, 70) || "New quote",
        meta: `${row.author_name}${row.is_visible ? "" : " · hidden"}`,
        image: row.image.url || undefined,
      })}
      addLabel="Add a testimonial"
      emptyLabel="No testimonials yet."
      viewHref="/"
      onSave={(rows) =>
        saveRows(
          "testimonials",
          rows.map((row) => ({
            id: row.id,
            quote: row.quote,
            author_name: row.author_name,
            author_role: row.author_role || null,
            image_url: row.image.url || null,
            image_alt: row.image.alt || null,
            is_visible: row.is_visible,
          })),
        )
      }
      renderRow={(row, update) => (
        <>
          <TextArea
            label="What they said"
            help="Keep it to a sentence or two — short quotes read better."
            value={row.quote}
            onChange={(x) => update({ quote: x })}
            max={220}
            rows={3}
          />
          <TextInput
            label="Their name"
            value={row.author_name}
            onChange={(x) => update({ author_name: x })}
            max={60}
          />
          <TextInput
            label="Where they are, or what they do"
            help="Optional. Shown in small type under the name."
            value={row.author_role}
            onChange={(x) => update({ author_role: x })}
            max={60}
          />
          <MediaField
            label="Photograph"
            help="Optional. Shown as a small circle above the quote."
            value={row.image}
            onChange={(x) => update({ image: x })}
          />
          <Toggle label="Show on the website" checked={row.is_visible} onChange={(x) => update({ is_visible: x })} />
        </>
      )}
    />
  );
}
