"use client";

import { SortableList } from "./sortable";

type LinkItem = { label: string; href: string };

const input =
  "w-full border border-line bg-canvas px-3 py-2 text-sm outline-none " +
  "transition-colors duration-200 placeholder:text-ink-muted focus:border-accent";

const addButton =
  "mt-3 border border-line px-4 py-2 text-[0.6875rem] tracking-[0.16em] uppercase " +
  "transition-colors duration-300 hover:border-ink";

/** A reorderable list of label + destination pairs. */
export function RepeaterLinks({
  value,
  onChange,
  addLabel,
  hrefLabel = "Goes to",
}: {
  value: LinkItem[];
  onChange: (value: LinkItem[]) => void;
  addLabel: string;
  hrefLabel?: string;
}) {
  const update = (index: number, patch: Partial<LinkItem>) =>
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div>
      <SortableList
        items={value.map((item, i) => ({ ...item, _key: `${i}` }))}
        getKey={(item) => item._key}
        onReorder={(next) => onChange(next.map(({ label, href }) => ({ label, href })))}
        renderItem={(item, index) => (
          <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
            <input
              value={item.label}
              placeholder="Wording"
              aria-label="Link wording"
              onChange={(e) => update(index, { label: e.target.value })}
              className={input}
            />
            <input
              value={item.href}
              placeholder="/collections"
              aria-label={hrefLabel}
              onChange={(e) => update(index, { href: e.target.value })}
              className={input}
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="px-3 text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase transition-colors hover:text-ink"
            >
              Remove
            </button>
          </div>
        )}
      />
      <button
        type="button"
        onClick={() => onChange([...value, { label: "", href: "" }])}
        className={addButton}
      >
        {addLabel}
      </button>
    </div>
  );
}

type Column = { title: string | null; links: LinkItem[] };

/** Footer columns: a heading plus its own list of links. */
export function RepeaterFooter({
  value,
  onChange,
}: {
  value: Column[];
  onChange: (value: Column[]) => void;
}) {
  const update = (index: number, patch: Partial<Column>) =>
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div>
      <SortableList
        items={value.map((item, i) => ({ ...item, _key: `${i}` }))}
        getKey={(item) => item._key}
        onReorder={(next) => onChange(next.map(({ title, links }) => ({ title, links })))}
        renderItem={(column, index) => (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                value={column.title ?? ""}
                placeholder="Column heading"
                aria-label="Column heading"
                onChange={(e) => update(index, { title: e.target.value })}
                className={input}
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="shrink-0 px-3 text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase transition-colors hover:text-ink"
              >
                Remove
              </button>
            </div>
            <div className="border-l border-line pl-4">
              <RepeaterLinks
                value={column.links}
                onChange={(links) => update(index, { links })}
                addLabel="Add link"
              />
            </div>
          </div>
        )}
      />
      <button
        type="button"
        onClick={() => onChange([...value, { title: "", links: [] }])}
        className={addButton}
      >
        Add a footer column
      </button>
    </div>
  );
}
