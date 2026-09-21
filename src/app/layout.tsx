import type { Metadata } from "next";
import { display, sans } from "@/lib/fonts";
import "./globals.css";

/**
 * Placeholder metadata only. From Phase 3 this is generated from
 * site_settings in Supabase — no SEO text is hardcoded in the app.
 */
export const metadata: Metadata = {
  title: "Velmora Beauté",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
