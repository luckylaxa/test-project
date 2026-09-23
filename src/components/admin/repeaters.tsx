"use client";

import { SortableList } from "./sortable";

type LinkItem = { label: string; href: string };

/**
 * A link needs both halves or the site drops it.
 *
 * `link()` in section-content returns null unless the label and the address are
 * both present — rendering a menu item that goes nowhere would be worse. But
 * the panel used to accept a half-filled row, say "Saved and published", and
 * leave the editor watching for a menu item that was never going to appear.
 */
export function incompleteLink(item: LinkItem): boolean {
  const label = item.label.trim();
  const href = item.href.trim();
  return (label === "") !== (href === "");
}

/** Names the rows an editor still has to finish, for the save bar. */
export function incompleteLinkNames(items: LinkItem[]): string[] {
  return items.filter(incompleteLink).map((i) => i.label.trim() || i.href.trim() || "a link");
}

const input =
  "w-full border border-line bg-canvas px-3 py-2 text-sm outline-none " +
  "transition-colors duration-200 placeholder:text-ink-muted/60 placeholder:italic focus:border-accent";

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
              className={`${input} ${
                incompleteLink(item) && item.label.trim() === "" ? "border-red-700" : ""
              }`}
            />
            <input
              value={item.href}
              placeholder="/collections"
              aria-label={hrefLabel}
              aria-describedby={incompleteLink(item) ? `link-warning-${index}` : undefined}
              onChange={(e) => update(index, { href: e.target.value })}
              className={`${input} ${
                incompleteLink(item) && item.href.trim() === "" ? "border-red-700" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="px-3 text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase transition-colors hover:text-ink"
            >
              Remove
            </button>
            {incompleteLink(item) ? (
              <p
                id={`link-warning-${index}`}
                className="text-[0.6875rem] text-red-700 sm:col-span-3"
              >
                {item.href.trim() === ""
                  ? "Add a web address, or this link will not appear on the site."
                  : "Add the wording, or this link will not appear on the site."}
              </p>
            ) : null}
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
