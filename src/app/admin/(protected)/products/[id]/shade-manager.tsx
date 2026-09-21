"use client";

import { useState } from "react";
import { ColorField, Select, Slider, TextInput, Toggle } from "@/components/admin/fields";
import { SortableList } from "@/components/admin/sortable";
import { ShadePreview } from "@/components/admin/shade-preview";
import { Constants } from "@/lib/types/database";
import type { Category, Finish } from "@/lib/try-on/makeup-renderer";

export type ShadeDraft = {
  key: string;
  id?: string;
  name: string;
  hex: string;
  finish: Finish;
  default_intensity: number;
  is_visible: boolean;
};

const FINISH_HELP: Record<Finish, string> = {
  matte: "Flat, no shine. The deepest-looking finish.",
  satin: "A soft sheen. The most forgiving on most people.",
  gloss: "Wet-look shine, with a bright catchlight.",
  shimmer: "Fine sparkle through the colour.",
  natural: "Barely there. For tints and skin products.",
};

/**
 * Add, edit, reorder and remove a product's shades, with each colour previewed
 * on a real model photo as it is edited.
 */
export function ShadeManager({
  shades,
  onChange,
  category,
  modelPhoto,
}: {
  shades: ShadeDraft[];
  onChange: (shades: ShadeDraft[]) => void;
  category: Category;
  modelPhoto: string | null;
}) {
  const [openKey, setOpenKey] = useState<string | null>(shades[0]?.key ?? null);

  const update = (key: string, patch: Partial<ShadeDraft>) =>
    onChange(shades.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  const add = () => {
    const key = crypto.randomUUID();
    onChange([
      ...shades,
      {
        key,
        name: "",
        hex: "#C08A76",
        finish: "satin",
        default_intensity: 0.7,
        is_visible: true,
      },
    ]);
    setOpenKey(key);
  };

  return (
    <div>
      <SortableList
        items={shades}
        getKey={(s) => s.key}
        onReorder={onChange}
        renderItem={(shade) => {
          const open = openKey === shade.key;
          return (
            <div>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-7 w-7 shrink-0 rounded-full ring-1 ring-ink/10"
                  style={{ background: shade.hex }}
                />
                <button
                  type="button"
                  onClick={() => setOpenKey(open ? null : shade.key)}
                  aria-expanded={open}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-sm">
                    {shade.name || "Untitled shade"}
                  </span>
                  <span className="block text-[0.625rem] tracking-[0.12em] text-ink-muted uppercase">
                    {shade.finish}
                    {shade.is_visible ? "" : " · hidden"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange(shades.filter((s) => s.key !== shade.key))}
                  className="shrink-0 text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase transition-colors hover:text-ink"
                >
                  Remove
                </button>
              </div>

              {open ? (
                <div className="mt-5 grid gap-6 border-t border-line pt-5 sm:grid-cols-[1fr_9rem]">
                  <div className="space-y-5">
                    <TextInput
                      label="Shade name"
                      value={shade.name}
                      onChange={(x) => update(shade.key, { name: x })}
                      max={40}
                      placeholder="Rouge Maison"
                    />
                    <ColorField
                      label="Colour"
                      value={shade.hex}
                      onChange={(x) => update(shade.key, { hex: x })}
                      help="Pick the colour, or paste a hex code from your product spec."
                    />
                    <Select
                      label="Finish"
                      value={shade.finish}
                      onChange={(x) => update(shade.key, { finish: x as Finish })}
                      options={Constants.public.Enums.shade_finish.map((f) => ({
                        value: f,
                        label: f.charAt(0).toUpperCase() + f.slice(1),
                      }))}
                      help={FINISH_HELP[shade.finish]}
                    />
                    <Slider
                      label="Strength"
                      value={Math.round(shade.default_intensity * 100)}
                      onChange={(x) => update(shade.key, { default_intensity: x / 100 })}
                    />
                    <Toggle
                      label="Show on the website"
                      checked={shade.is_visible}
                      onChange={(x) => update(shade.key, { is_visible: x })}
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-[0.6875rem] tracking-[0.14em] uppercase">Preview</p>
                    <ShadePreview
                      photoUrl={modelPhoto}
                      hex={shade.hex}
                      finish={shade.finish}
                      intensity={shade.default_intensity}
                      category={category}
                      className="aspect-[3/4] w-full"
                    />
                    <p className="mt-2 text-xs text-ink-muted">
                      Shown on a try-on model, exactly as visitors will see it.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          );
        }}
      />

      <button
        type="button"
        onClick={add}
        className="mt-3 border border-line px-4 py-2 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:border-ink"
      >
        Add a shade
      </button>
    </div>
  );
}
