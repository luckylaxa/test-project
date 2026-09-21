"use client";

import { RowsEditor } from "@/components/admin/rows-editor";
import { TextInput, Toggle } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-field";
import { saveRows } from "@/lib/admin/rows-actions";
import type { TryOnModelRow } from "@/lib/content";

type Draft = {
  key: string;
  id?: string;
  name: string;
  photo: { url: string; alt: string };
  is_visible: boolean;
};

export function ModelsForm({ models }: { models: TryOnModelRow[] }) {
  return (
    <RowsEditor<Draft>
      initial={models.map((m) => ({
        key: m.id,
        id: m.id,
        name: m.name ?? "",
        photo: { url: m.photo_url ?? "", alt: m.photo_alt ?? "" },
        is_visible: m.is_visible,
      }))}
      blank={() => ({
        key: crypto.randomUUID(),
        name: "",
        photo: { url: "", alt: "" },
        is_visible: true,
      })}
      summary={(row) => ({
        title: row.name,
        meta: row.photo.url ? (row.is_visible ? undefined : "hidden") : "no photo yet",
        image: row.photo.url || undefined,
      })}
      addLabel="Add a model"
      emptyLabel="No models yet."
      viewHref="/try-on"
      onSave={(rows) =>
        saveRows(
          "try_on_models",
          rows.map((row) => ({
            id: row.id,
            name: row.name,
            photo_url: row.photo.url || null,
            photo_alt: row.photo.alt || null,
            // A model with no photograph cannot be rendered, so never offer it.
            is_visible: row.is_visible && Boolean(row.photo.url),
          })),
        )
      }
      renderRow={(row, update) => (
        <>
          <TextInput label="Name" value={row.name} onChange={(x) => update({ name: x })} max={40} />
          <MediaField
            label="Photograph"
            help="A clear, front-facing portrait in even light, with bare lips and eyes. The face should fill a good part of the frame — the larger the face, the more precisely shades will sit."
            value={row.photo}
            onChange={(x) => update({ photo: x })}
          />
          <Toggle
            label="Offer in the try-on"
            help="A model without a photograph is never shown, whatever this is set to."
            checked={row.is_visible}
            onChange={(x) => update({ is_visible: x })}
          />
        </>
      )}
    />
  );
}
