import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/try-on" });
}

/**
 * Placeholder until Phase 4 builds the studio.
 * The copy shown here already comes from site_settings, so nothing has to be
 * rewritten when the real experience lands.
 */
export default async function TryOnPage() {
  const settings = await getSiteSettings();

  return (
    <section className="shell flex min-h-[70svh] flex-col justify-center py-32">
      <p className="eyebrow">Virtual Try-On</p>
      <h1 className="mt-6 text-5xl md:text-7xl">The studio opens shortly.</h1>
      {settings?.camera_permission_body ? (
        <p className="measure mt-7 text-ink-soft">{settings.camera_permission_body}</p>
      ) : null}
      {settings?.try_on_disclaimer ? (
        <p className="mt-10 text-xs text-ink-muted">{settings.try_on_disclaimer}</p>
      ) : null}
      <hr className="rule mt-14" />
    </section>
  );
}
