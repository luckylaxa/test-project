import { Cormorant_Garamond, Jost } from "next/font/google";

/** High-contrast display serif — headlines only. */
export const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

/** Refined geometric sans — body copy, labels and all UI. */
export const sans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--font-sans-ui",
});
