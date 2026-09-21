"use client";

import { usePathname } from "next/navigation";

/**
 * A soft cross-fade between pages.
 *
 * Keyed on the pathname so React remounts the subtree on navigation, which
 * restarts the animation. Deliberately short and opacity-only — a luxury site
 * should feel calm, not animated. Disabled entirely under
 * prefers-reduced-motion by the rule in globals.css.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
