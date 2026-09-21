"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Sticky save bar.
 *
 * Warns before leaving with unsaved edits — a beauty team should never lose a
 * paragraph to a stray back button.
 */
export function SaveBar({
  dirty,
  state,
  error,
  onSave,
  viewHref,
  saveLabel = "Save & Publish",
}: {
  dirty: boolean;
  state: SaveState;
  error?: string | null;
  onSave: () => void;
  viewHref?: string;
  saveLabel?: string;
}) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <div className="sticky bottom-0 z-20 -mx-6 mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line bg-canvas/95 px-6 py-4 backdrop-blur-sm">
      <p className="text-xs text-ink-muted" role="status">
        {state === "saving"
          ? "Saving…"
          : state === "saved"
            ? "Saved and published."
            : state === "error"
              ? error || "Something went wrong."
              : dirty
                ? "You have unsaved changes."
                : "Everything is saved."}
      </p>

      <div className="flex items-center gap-3">
        {viewHref ? (
          <Link
            href={viewHref}
            target="_blank"
            className="border border-line px-5 py-2.5 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:border-ink"
          >
            View live site
          </Link>
        ) : null}
        <button
          type="button"
          onClick={onSave}
          disabled={state === "saving" || !dirty}
          className="bg-ink px-6 py-2.5 text-[0.6875rem] tracking-[0.16em] text-canvas uppercase transition-colors duration-300 hover:bg-accent hover:text-ink disabled:opacity-40"
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

/** Tracks edit state for a form whose value is a plain object. */
export function useEditor<T>(initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [saved, setSaved] = useState<T>(initial);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const dirty = JSON.stringify(value) !== JSON.stringify(saved);

  const set = <K extends keyof T>(key: K, next: T[K]) => {
    setValue((current) => ({ ...current, [key]: next }));
    setState("idle");
  };

  async function save(run: (value: T) => Promise<{ ok: true } | { ok: false; error: string }>) {
    setState("saving");
    setError(null);
    const result = await run(value);
    if (result.ok) {
      setSaved(value);
      setState("saved");
    } else {
      setError(result.error);
      setState("error");
    }
  }

  return { value, setValue, set, dirty, state, error, save };
}
