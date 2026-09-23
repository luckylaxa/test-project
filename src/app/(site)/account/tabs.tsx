"use client";

import { useState } from "react";

type Panel = {
  id: string;
  label: string;
  count?: number | null;
  content: React.ReactNode;
};

/**
 * Account sections as tabs rather than one long column.
 *
 * Stacked, a customer with a hundred saved items had to scroll past all of
 * them to reach their orders — the one thing people come to an account page
 * for. Every panel stays mounted so switching is instant and nothing refetches.
 */
export function AccountTabs({
  panels,
  initial,
}: {
  panels: Panel[];
  initial?: string;
}) {
  const available = panels.filter((p) => p.content !== null);
  const [active, setActive] = useState(
    () => available.find((p) => p.id === initial)?.id ?? available[0]?.id ?? "",
  );

  if (available.length === 0) return null;

  return (
    <div className="mt-10">
      <div
        role="tablist"
        aria-label="Account sections"
        className="flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {available.map((panel) => {
          const on = panel.id === active;
          return (
            <button
              key={panel.id}
              role="tab"
              id={`tab-${panel.id}`}
              aria-selected={on}
              aria-controls={`panel-${panel.id}`}
              type="button"
              onClick={() => setActive(panel.id)}
              className={`tap shrink-0 border-b-2 px-4 text-[0.625rem] tracking-[0.16em] whitespace-nowrap uppercase transition-colors duration-300 ${
                on
                  ? "border-accent text-ink"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {panel.label}
              {typeof panel.count === "number" && panel.count > 0 ? (
                <span className="ml-1.5 tabular-nums text-ink-muted">
                  ({panel.count})
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {available.map((panel) => (
        <div
          key={panel.id}
          role="tabpanel"
          id={`panel-${panel.id}`}
          aria-labelledby={`tab-${panel.id}`}
          hidden={panel.id !== active}
        >
          {panel.content}
        </div>
      ))}
    </div>
  );
}
