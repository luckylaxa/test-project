"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-xl py-10">
      <h1 className="font-[family-name:var(--font-display)] text-2xl">
        This screen could not load.
      </h1>
      <p className="mt-3 text-sm text-ink-muted">
        Your content is safe — nothing has been changed. Try again, and if it keeps happening,
        sign out and back in.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 border border-line px-5 py-2.5 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:border-ink"
      >
        Try again
      </button>
    </div>
  );
}
