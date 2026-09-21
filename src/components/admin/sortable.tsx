"use client";

import { useState } from "react";

/**
 * Drag-to-reorder list.
 *
 * Dragging is the obvious gesture, but it is unusable with a keyboard and
 * awkward on a touchscreen, so every row also gets move up/down buttons. Both
 * report the same reordered array.
 */
export function SortableList<T>({
  items,
  getKey,
  onReorder,
  renderItem,
  disabled = false,
}: {
  items: T[];
  getKey: (item: T) => string;
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  disabled?: boolean;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  };

  return (
    <ul className="space-y-2">
      {items.map((item, index) => {
        const isDragging = dragIndex === index;
        const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;

        return (
          <li
            key={getKey(item)}
            draggable={!disabled}
            onDragStart={(e) => {
              setDragIndex(index);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(index);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) move(dragIndex, index);
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={`flex items-start gap-3 border bg-canvas p-3 transition-all duration-200 ${
              isDragging ? "opacity-40" : "opacity-100"
            } ${isOver ? "border-accent" : "border-line"}`}
          >
            <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
              <span
                aria-hidden
                className={`flex h-5 w-5 items-center justify-center text-ink-muted ${
                  disabled ? "" : "cursor-grab active:cursor-grabbing"
                }`}
                title="Drag to reorder"
              >
                <span className="flex flex-col gap-[3px]">
                  <span className="block h-px w-3.5 bg-current" />
                  <span className="block h-px w-3.5 bg-current" />
                  <span className="block h-px w-3.5 bg-current" />
                </span>
              </span>
              <button
                type="button"
                onClick={() => move(index, index - 1)}
                disabled={index === 0 || disabled}
                aria-label="Move up"
                className="text-ink-muted transition-colors hover:text-ink disabled:opacity-25"
              >
                <span aria-hidden className="block text-xs leading-none">
                  ▲
                </span>
              </button>
              <button
                type="button"
                onClick={() => move(index, index + 1)}
                disabled={index === items.length - 1 || disabled}
                aria-label="Move down"
                className="text-ink-muted transition-colors hover:text-ink disabled:opacity-25"
              >
                <span aria-hidden className="block text-xs leading-none">
                  ▼
                </span>
              </button>
            </div>

            <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
          </li>
        );
      })}
    </ul>
  );
}
