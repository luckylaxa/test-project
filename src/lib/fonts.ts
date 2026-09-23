import localFont from "next/font/local";

/*
 * Self-hosted, for the same reason the try-on model is (CLAUDE.md): no
 * third-party request, and nothing at build time that depends on somebody
 * else's server being up and returning what we expect.
 *
 * It also fixes a hard build failure. `next/font/google` fetches the CSS at
 * build time, and Google now serves both families as VARIABLE fonts — every
 * weight of Cormorant Garamond italic pointed at one file. Turbopack's font
 * loader rejects that outright ("next/font/google queries have exactly one
 * entry"), so `next build` stopped working with nine errors and no page output.
 * Nothing in this repository changed to cause it.
 *
 * These are the latin-subset variable files, one per style: 100KB for both
 * families, against six static files before. `weight` is a range, so 300, 400
 * and 500 all come from the same file and no weight is a synthetic bolding.
 */

/** High-contrast display serif — headlines only. */
export const display = localFont({
  src: [
    { path: "../app/fonts/cormorant-garamond-normal.woff2", weight: "300 700", style: "normal" },
    { path: "../app/fonts/cormorant-garamond-italic.woff2", weight: "300 700", style: "italic" },
  ],
  display: "swap",
  variable: "--font-display",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

/** Refined geometric sans — body copy, labels and all UI. */
export const sans = localFont({
  src: [{ path: "../app/fonts/jost-normal.woff2", weight: "100 900", style: "normal" }],
  display: "swap",
  variable: "--font-sans-ui",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});
