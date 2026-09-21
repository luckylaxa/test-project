"use client";

import { useEffect } from "react";

/**
 * Public error boundary.
 *
 * This is the one screen whose wording cannot come from the database: it is
 * what renders when reading the database is exactly what failed. Kept short,
 * calm and free of technical detail.
 */
export default function SiteError({
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
    <main className="shell flex min-h-[70svh] flex-col items-center justify-center py-24 text-center">
      <h1 className="text-4xl md:text-5xl">Something interrupted this page.</h1>
      <p className="measure mt-5 text-ink-soft">
        It is almost certainly temporary. Try again in a moment.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-9 border border-ink/25 px-8 py-3.5 text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-500 hover:border-ink hover:bg-ink hover:text-canvas"
      >
        Try again
      </button>
    </main>
  );
}
