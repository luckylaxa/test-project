"use client";

import { useState } from "react";
import { SaveBar, useEditor } from "./save-bar";
import { SortableList } from "./sortable";

export type RowDraft = { key: string; id?: string };

/**
 * A reorderable list of records, each edited inline.
 *
 * Shared by collections, testimonials, press logos and try-on models — screens
 * that differ only in their fields. Saving replaces the whole list, which keeps
 * sort order honest and is easier to reason about than tracking each add and
 * remove.
 */
export function RowsEditor<T extends RowDraft>({
  initial,
  blank,
  summary,
  renderRow,
  onSave,
  addLabel,
  emptyLabel,
  viewHref,
  startOpen = false,
}: {
  initial: T[];
  blank: () => T;
  summary: (row: T) => { title: string; meta?: string; swatch?: string; image?: string };
  renderRow: (row: T, update: (patch: Partial<T>) => void) => React.ReactNode;
  onSave: (rows: T[]) => Promise<{ ok: true } | { ok: false; error: string }>;
  addLabel: string;
  emptyLabel: string;
  viewHref?: string;
  startOpen?: boolean;
}) {
  const editor = useEditor<{ rows: T[] }>({ rows: initial });
  const [openKey, setOpenKey] = useState<string | null>(
    startOpen ? (initial[0]?.key ?? null) : null,
  );

  const rows = editor.value.rows;
  const setRows = (next: T[]) => editor.set("rows", next);

  const update = (key: string, patch: Partial<T>) =>
    setRows(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const add = () => {
    const row = blank();
    setRows([...rows, row]);
    setOpenKey(row.key);
  };

  return (
    <div className="max-w-3xl">
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">{emptyLabel}</p>
      ) : (
        <SortableList
          items={rows}
          getKey={(row) => row.key}
          onReorder={setRows}
          renderItem={(row) => {
            const open = openKey === row.key;
            const info = summary(row);
            return (
              <div>
                <div className="flex items-center gap-3">
                  {info.swatch ? (
                    <span
                      aria-hidden
                      className="h-7 w-7 shrink-0 rounded-full ring-1 ring-ink/10"
                      style={{ background: info.swatch }}
                    />
                  ) : null}
                  {info.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={info.image}
                      alt=""
                      className="h-12 w-10 shrink-0 bg-canvas-soft object-cover"
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setOpenKey(open ? null : row.key)}
                    aria-expanded={open}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-sm">{info.title || "Untitled"}</span>
                    {info.meta ? (
                      <span className="block text-[0.625rem] tracking-[0.12em] text-ink-muted uppercase">
                        {info.meta}
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
                    className="shrink-0 text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase transition-colors hover:text-ink"
                  >
                    Remove
                  </button>
                </div>

                {open ? (
                  <div className="mt-5 space-y-5 border-t border-line pt-5">
                    {renderRow(row, (patch) => update(row.key, patch))}
                  </div>
                ) : null}
              </div>
            );
          }}
        />
      )}

      <button
        type="button"
        onClick={add}
        className="mt-4 border border-line px-4 py-2 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:border-ink"
      >
        {addLabel}
      </button>

      <SaveBar
        dirty={editor.dirty}
        state={editor.state}
        error={editor.error}
        onSave={() => editor.save((form) => onSave(form.rows))}
        viewHref={viewHref}
      />
    </div>
  );
}
