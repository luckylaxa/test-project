"use client";

import { useState } from "react";
import { TextArea, TextInput, Toggle } from "@/components/admin/fields";
import { SaveBar, useEditor } from "@/components/admin/save-bar";
import { SortableList } from "@/components/admin/sortable";
import { Constants, type Database, type Json } from "@/lib/types/database";
import type { PageRow, SectionRow } from "@/lib/content";
import { SECTION_INFO, SectionFields } from "./section-fields";
import { savePage } from "../actions";

type SectionType = Database["public"]["Enums"]["section_type"];

type SectionDraft = {
  key: string;
  id?: string;
  type: SectionType;
  content: Json;
  is_visible: boolean;
};

type Form = {
  title: string;
  seo_title: string;
  seo_description: string;
  is_published: boolean;
  sections: SectionDraft[];
};

export function PageForm({ page, sections }: { page: PageRow; sections: SectionRow[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const editor = useEditor<Form>({
    title: page.title ?? "",
    seo_title: page.seo_title ?? "",
    seo_description: page.seo_description ?? "",
    is_published: page.is_published,
    sections: sections.map((s) => ({
      key: s.id,
      id: s.id,
      type: s.type,
      content: s.content,
      is_visible: s.is_visible,
    })),
  });

  const { value: v, set } = editor;

  const updateSection = (key: string, patch: Partial<SectionDraft>) =>
    set("sections", v.sections.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  const addSection = (type: SectionType) => {
    const key = crypto.randomUUID();
    set("sections", [...v.sections, { key, type, content: {}, is_visible: true }]);
    setOpenKey(key);
    setAdding(false);
  };

  const viewHref = page.slug === "home" ? "/" : `/${page.slug}`;

  return (
    <div className="max-w-3xl">
      <section className="mb-10 border-b border-line pb-10">
        <h2 className="mb-5 font-[family-name:var(--font-display)] text-xl">Page details</h2>
        <div className="space-y-6">
          <TextInput label="Page name" help="Only you see this." value={v.title} onChange={(x) => set("title", x)} max={60} />
          <TextInput
            label="Page title for search engines"
            value={v.seo_title}
            onChange={(x) => set("seo_title", x)}
            max={60}
          />
          <TextArea
            label="Description for search engines"
            value={v.seo_description}
            onChange={(x) => set("seo_description", x)}
            max={160}
            rows={3}
          />
          <Toggle
            label="Published"
            help="Turn off to take the whole page off the website."
            checked={v.is_published}
            onChange={(x) => set("is_published", x)}
          />
        </div>
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl">Sections</h2>
        <p className="mt-1.5 mb-5 text-sm text-ink-muted">
          The blocks that make up this page, top to bottom. Drag to reorder, or hide one without
          deleting it.
        </p>

        {v.sections.length === 0 ? (
          <p className="text-sm text-ink-muted">This page has no sections yet.</p>
        ) : (
          <SortableList
            items={v.sections}
            getKey={(s) => s.key}
            onReorder={(next) => set("sections", next)}
            renderItem={(section) => {
              const open = openKey === section.key;
              const info = SECTION_INFO[section.type];
              return (
                <div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenKey(open ? null : section.key)}
                      aria-expanded={open}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block text-sm">{info.label}</span>
                      <span className="block truncate text-[0.625rem] tracking-[0.12em] text-ink-muted uppercase">
                        {section.is_visible ? info.help : "Hidden · " + info.help}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSection(section.key, { is_visible: !section.is_visible })}
                      className="shrink-0 text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase transition-colors hover:text-ink"
                    >
                      {section.is_visible ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      onClick={() => set("sections", v.sections.filter((s) => s.key !== section.key))}
                      className="shrink-0 text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase transition-colors hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>

                  {open ? (
                    <div className="mt-5 space-y-5 border-t border-line pt-5">
                      <SectionFields
                        type={section.type}
                        content={section.content}
                        onChange={(content) => updateSection(section.key, { content })}
                      />
                    </div>
                  ) : null}
                </div>
              );
            }}
          />
        )}

        {adding ? (
          <div className="mt-4 border border-line p-4">
            <p className="mb-3 text-[0.6875rem] tracking-[0.14em] uppercase">Choose a section</p>
            <ul className="grid gap-px bg-line sm:grid-cols-2">
              {Constants.public.Enums.section_type.map((type) => (
                <li key={type}>
                  <button
                    type="button"
                    onClick={() => addSection(type)}
                    className="block w-full bg-canvas p-3 text-left transition-colors hover:bg-canvas-soft"
                  >
                    <span className="block text-sm">{SECTION_INFO[type].label}</span>
                    <span className="block text-xs text-ink-muted">{SECTION_INFO[type].help}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="mt-3 text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase hover:text-ink"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-4 border border-line px-4 py-2 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:border-ink"
          >
            Add a section
          </button>
        )}
      </section>

      <SaveBar
        dirty={editor.dirty}
        state={editor.state}
        error={editor.error}
        viewHref={viewHref}
        onSave={() =>
          editor.save((form) =>
            savePage(
              page.id,
              page.slug,
              {
                title: form.title,
                seo_title: form.seo_title || null,
                seo_description: form.seo_description || null,
                is_published: form.is_published,
              },
              form.sections.map((s) => ({
                id: s.id,
                type: s.type,
                content: s.content,
                is_visible: s.is_visible,
              })),
            ),
          )
        }
      />
    </div>
  );
}
