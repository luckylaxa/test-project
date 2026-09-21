import Link from "next/link";

/**
 * Deliberately minimal: a 404 can be reached when content is unpublished, so it
 * must not depend on any content row existing.
 */
export default function NotFound() {
  return (
    <main className="shell flex min-h-dvh flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-6 text-5xl md:text-6xl">This page has moved on.</h1>
      <Link
        href="/"
        className="mt-10 inline-flex items-center justify-center border border-ink/25 px-8 py-3.5 text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-500 hover:border-ink hover:bg-ink hover:text-canvas"
      >
        Return home
      </Link>
    </main>
  );
}
