import type { Metadata } from "next";
import { display, sans } from "@/lib/fonts";
import { getSiteSettings } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/" });
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();

  // The accent colour is the one visual token editors control. Setting it on
  // <html> lets it cascade into every component, including the admin panel.
  const accent = settings?.accent_color;

  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable}`}
      style={accent ? ({ "--accent": accent } as React.CSSProperties) : undefined}
    >
      <body>{children}</body>
    </html>
  );
}
