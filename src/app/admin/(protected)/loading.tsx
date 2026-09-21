/** Quiet placeholder while an admin screen loads. */
export default function AdminLoading() {
  return (
    <div className="animate-pulse py-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="h-8 w-56 bg-line" />
      <div className="mt-3 h-4 w-80 bg-line-soft" />
      <div className="mt-10 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 border border-line" />
        ))}
      </div>
    </div>
  );
}
