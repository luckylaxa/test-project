"use client";

import { RowsEditor } from "@/components/admin/rows-editor";
import { TextArea, TextInput, Toggle } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-field";
import { LookPreview } from "@/components/admin/look-preview";
import { SortableList } from "@/components/admin/sortable";
import type { LookWithItems, ProductWithShades } from "@/lib/content";
import type { Category, MakeupLayer } from "@/lib/try-on/makeup-renderer";
import { saveLooks } from "./actions";

type Item = { shade_id: string; intensity: number | null };
type Draft = {
  key: string;
  id?: string;
  name: string;
  slug: string;
  description: string;
  cover: { url: string; alt: string };
  is_visible: boolean;
  items: Item[];
};

export function LooksForm({
  looks,
  products,
  modelPhoto,
}: {
  looks: LookWithItems[];
  products: ProductWithShades[];
  modelPhoto: string | null;
}) {
  // Flat index so an item only has to store a shade id.
  const shadeIndex = new Map(
    products.flatMap((product) =>
      (product.shades ?? [])
        .filter((shade) => shade.is_visible)
        .map((shade) => [shade.id, { product, shade }] as const),
    ),
  );

  const layersFor = (items: Item[]): MakeupLayer[] =>
    items.flatMap((item) => {
      const entry = shadeIndex.get(item.shade_id);
      if (!entry) return [];
      return [
        {
          category: entry.product.category as Category,
          hex: entry.shade.hex,
          finish: entry.shade.finish,
          intensity: item.intensity ?? Number(entry.shade.default_intensity),
        },
      ];
    });

  return (
    <RowsEditor<Draft>
      initial={looks.map((look) => ({
        key: look.id,
        id: look.id,
        name: look.name ?? "",
        slug: look.slug,
        description: look.description ?? "",
        cover: { url: look.cover_image_url ?? "", alt: look.cover_image_alt ?? "" },
        is_visible: look.is_visible,
        items: look.items.map((item) => ({
          shade_id: item.shade.id,
          intensity: item.intensity === null ? null : Number(item.intensity),
        })),
      }))}
      blank={() => ({
        key: crypto.randomUUID(),
        name: "",
        slug: "",
        description: "",
        cover: { url: "", alt: "" },
        is_visible: false,
        items: [],
      })}
      summary={(row) => ({
        title: row.name,
        meta: `${row.items.length} shade${row.items.length === 1 ? "" : "s"}${row.is_visible ? "" : " · hidden"}`,
        image: row.cover.url || undefined,
      })}
      addLabel="Add a look"
      emptyLabel="No looks yet."
      viewHref="/looks"
      onSave={(rows) =>
        saveLooks(
          rows.map((row) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description || null,
            cover_image_url: row.cover.url || null,
            cover_image_alt: row.cover.alt || null,
            is_visible: row.is_visible,
            items: row.items,
          })),
        )
      }
      renderRow={(row, update) => (
        <div className="grid gap-8 lg:grid-cols-[1fr_11rem]">
          <div className="space-y-5">
            <TextInput label="Look name" value={row.name} onChange={(x) => update({ name: x })} max={50} />
            <TextInput
              label="Web address"
              help="The part after /try-on?look="
              value={row.slug}
              onChange={(x) => update({ slug: x.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
              max={50}
            />
            <TextArea
              label="Description"
              value={row.description}
              onChange={(x) => update({ description: x })}
              rows={3}
              max={280}
            />
            <MediaField label="Cover image" value={row.cover} onChange={(x) => update({ cover: x })} />

            <div>
              <p className="mb-2 text-[0.6875rem] tracking-[0.14em] uppercase">Shades in this look</p>
              <p className="mb-3 text-xs text-ink-muted">
                Pick one shade per product. Drag to reorder, and adjust how strongly each is applied.
              </p>

              {row.items.length > 0 ? (
                <SortableList
                  items={row.items.map((item, i) => ({ ...item, _key: `${i}` }))}
                  getKey={(i) => i._key}
                  onReorder={(next) =>
                    update({ items: next.map(({ shade_id, intensity }) => ({ shade_id, intensity })) })
                  }
                  renderItem={(item, index) => {
                    const entry = shadeIndex.get(item.shade_id);
                    const fallback = entry ? Number(entry.shade.default_intensity) : 0.6;
                    const strength = Math.round((item.intensity ?? fallback) * 100);
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className="h-5 w-5 shrink-0 rounded-full ring-1 ring-ink/10"
                            style={{ background: entry?.shade.hex ?? "#ccc" }}
                          />
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {entry ? `${entry.product.name} · ${entry.shade.name}` : "Shade no longer exists"}
                          </span>
                          <button
                            type="button"
                            onClick={() => update({ items: row.items.filter((_, i) => i !== index) })}
                            className="shrink-0 text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase hover:text-ink"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={strength}
                            aria-label="Strength"
                            onChange={(e) =>
                              update({
                                items: row.items.map((it, i) =>
                                  i === index ? { ...it, intensity: Number(e.target.value) / 100 } : it,
                                ),
                              })
                            }
                            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-line accent-[var(--accent)]"
                          />
                          <span className="w-10 shrink-0 text-right text-[0.6875rem] tabular-nums text-ink-muted">
                            {strength}%
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              ) : null}

              <div className="mt-4 space-y-3 border-t border-line pt-4">
                {products.map((product) => {
                  const shades = (product.shades ?? []).filter((s) => s.is_visible);
                  if (shades.length === 0) return null;
                  return (
                    <div key={product.id}>
                      <p className="text-xs text-ink-muted">{product.name}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {shades.map((shade) => {
                          const on = row.items.some((i) => i.shade_id === shade.id);
                          return (
                            <button
                              key={shade.id}
                              type="button"
                              title={shade.name}
                              aria-pressed={on}
                              aria-label={`${product.name} ${shade.name}`}
                              onClick={() =>
                                update({
                                  items: on
                                    ? row.items.filter((i) => i.shade_id !== shade.id)
                                    : [
                                        // One shade per product, as on a real face.
                                        ...row.items.filter(
                                          (i) => shadeIndex.get(i.shade_id)?.product.id !== product.id,
                                        ),
                                        { shade_id: shade.id, intensity: null },
                                      ],
                                })
                              }
                              className={`h-6 w-6 rounded-full ring-1 transition-all ${
                                on ? "ring-2 ring-ink" : "ring-ink/10 hover:ring-ink/40"
                              }`}
                              style={{ background: shade.hex }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Toggle
              label="Show on the website"
              checked={row.is_visible}
              onChange={(x) => update({ is_visible: x })}
            />
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <p className="mb-2 text-[0.6875rem] tracking-[0.14em] uppercase">Preview</p>
            <LookPreview
              photoUrl={modelPhoto}
              layers={layersFor(row.items)}
              className="aspect-[3/4] w-full"
            />
          </div>
        </div>
      )}
    />
  );
}
