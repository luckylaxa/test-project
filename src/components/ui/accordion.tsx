"use client";

import { useId, useState } from "react";

/** Hairline accordion used for product details. Skips empty entries. */
export function Accordion({ items }: { items: { title: string; body: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const id = useId();

  if (items.length === 0) return null;

  return (
    <div className="border-t border-line">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.title} className="border-b border-line">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${id}-${index}`}
                onClick={() => setOpen(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left text-[0.6875rem] uppercase tracking-[0.2em] transition-colors duration-300 hover:text-accent"
              >
                {item.title}
                <span aria-hidden className="relative h-3 w-3 shrink-0">
                  <span className="absolute top-1/2 left-0 h-px w-3 -translate-y-1/2 bg-current" />
                  <span
                    className={`absolute top-0 left-1/2 h-3 w-px -translate-x-1/2 bg-current transition-transform duration-500 ease-[var(--ease-editorial)] ${
                      isOpen ? "scale-y-0" : "scale-y-100"
                    }`}
                  />
                </span>
              </button>
            </h3>
            <div
              id={`${id}-${index}`}
              hidden={!isOpen}
              className="measure pb-6 text-sm leading-relaxed whitespace-pre-line text-ink-soft"
            >
              {item.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
