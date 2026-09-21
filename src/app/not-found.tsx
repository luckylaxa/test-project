import Link from "next/link";
import { getSiteSettings } from "@/lib/content";
import { makeLabels } from "@/lib/labels";

/**
 * Page not found.
 *
 * The wording is editable like the rest of the site, but this screen also has
 * to work when something is wrong, so a failed settings read falls back to the
 * defaults in makeLabels rather than throwing a second error.
 */
export default async function NotFound() {
  let settings = null;
  try {
    settings = await getSiteSettings();
  } catch {
    // Fall through to the built-in wording.
  }
  const labels = makeLabels(settings);

  return (
    <main className="shell flex min-h-dvh flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">{labels.t("not_found_eyebrow")}</p>
      <h1 className="mt-6 text-5xl md:text-6xl">{labels.t("not_found_title")}</h1>
      <p className="measure mt-6 text-ink-soft">{labels.t("not_found_body")}</p>
      <Link
        href="/"
        className="mt-10 inline-flex items-center justify-center border border-ink/25 px-8 py-3.5 text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-500 hover:border-ink hover:bg-ink hover:text-canvas"
      >
        {labels.t("not_found_button")}
      </Link>
    </main>
  );
}
