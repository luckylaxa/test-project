/**
 * Temporary Phase 1 placeholder so the scaffold runs.
 * Phase 3 replaces this with the section-driven home page rendered from Supabase.
 */
export default function Home() {
  return (
    <main className="shell flex min-h-dvh flex-col justify-center py-24">
      <p className="eyebrow">Phase 1 · Foundation</p>
      <h1 className="mt-6 text-5xl md:text-7xl">Velmora Beauté</h1>
      <p className="measure mt-6 text-ink-soft">
        Design tokens, typography and the Supabase client are in place. The public site is
        built in Phase 3 and renders entirely from content stored in Supabase.
      </p>
      <hr className="rule mt-12" />
    </main>
  );
}
