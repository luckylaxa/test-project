import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/content";
import { makeLabels } from "@/lib/labels";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const labels = makeLabels(settings);
  return buildMetadata({ title: labels.t("checkout_cancelled_title"), path: "/checkout/cancelled" });
}

/** Where someone lands if they back out of paying. The basket is deliberately kept. */
export default async function CheckoutCancelledPage() {
  const settings = await getSiteSettings();
  const labels = makeLabels(settings);

  return (
    <section className="shell flex min-h-[70svh] flex-col items-center justify-center py-24 text-center">
      <h1 className="text-4xl md:text-6xl">{labels.t("checkout_cancelled_title")}</h1>
      <p className="measure mt-6 text-ink-soft">{labels.t("checkout_cancelled_body")}</p>
      <Link
        href="/collections"
        className="mt-10 inline-flex items-center justify-center border border-ink/25 px-8 py-3.5 text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-500 hover:border-ink hover:bg-ink hover:text-canvas"
      >
        {labels.t("checkout_cancelled_button")}
      </Link>
    </section>
  );
}
