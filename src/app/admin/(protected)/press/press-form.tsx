"use client";

import { RowsEditor } from "@/components/admin/rows-editor";
import { TextInput, Toggle } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-field";
import { saveRows } from "@/lib/admin/rows-actions";
import type { PressRow } from "@/lib/content";

type Draft = {
  key: string;
  id?: string;
  name: string;
  logo: { url: string; alt: string };
  link_url: string;
  is_visible: boolean;
};

export function PressForm({ logos }: { logos: PressRow[] }) {
  return (
    <RowsEditor<Draft>
      initial={logos.map((p) => ({
        key: p.id,
        id: p.id,
        name: p.name ?? "",
        logo: { url: p.logo_url ?? "", alt: p.logo_alt ?? "" },
        link_url: p.link_url ?? "",
        is_visible: p.is_visible,
      }))}
      blank={() => ({
        key: crypto.randomUUID(),
        name: "",
        logo: { url: "", alt: "" },
        link_url: "",
        is_visible: true,
      })}
      summary={(row) => ({
        title: row.name,
        meta: row.is_visible ? undefined : "hidden",
        image: row.logo.url || undefined,
      })}
      addLabel="Add a publication"
      emptyLabel="No press logos yet."
      viewHref="/"
      onSave={(rows) =>
        saveRows(
          "press_logos",
          rows.map((row) => ({
            id: row.id,
            name: row.name,
            logo_url: row.logo.url || null,
            logo_alt: row.logo.alt || null,
            link_url: row.link_url || null,
            is_visible: row.is_visible,
          })),
        )
      }
      renderRow={(row, update) => (
        <>
          <TextInput
            label="Publication name"
            help="Shown as text if no logo is uploaded."
            value={row.name}
            onChange={(x) => update({ name: x })}
            max={60}
          />
          <MediaField
            label="Logo"
            help="A wide image with a transparent background works best."
            value={row.logo}
            onChange={(x) => update({ logo: x })}
            accept="image/png,image/svg+xml,image/webp"
          />
          <TextInput
            label="Links to"
            help="Optional. Where the logo goes when clicked."
            value={row.link_url}
            onChange={(x) => update({ link_url: x })}
          />
          <Toggle label="Show on the website" checked={row.is_visible} onChange={(x) => update({ is_visible: x })} />
        </>
      )}
    />
  );
}
