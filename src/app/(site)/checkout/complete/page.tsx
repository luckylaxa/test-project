import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getSiteSettings } from "@/lib/content";
import { makeLabels } from "@/lib/labels";
import { buildMetadata } from "@/lib/metadata";
import { ClearCart } from "@/components/cart/clear-cart";
import { Completion } from "./completion";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const labels = makeLabels(settings);
  return buildMetadata({ title: labels.t("checkout_complete_title"), path: "/checkout/complete" });
}

/**
 * Shown once a payment has been confirmed.
 *
 * It does not confirm the payment itself — that already happened server side,
 * where the signature was checked. Razorpay remains the record of truth, and a
 * success URL can be opened by anyone. It simply acknowledges and empties the
 * basket.
 */
export default async function CheckoutCompletePage() {
  const settings = await getSiteSettings();
  const labels = makeLabels(settings);

  return (
    <section className="shell flex min-h-[70svh] flex-col items-center justify-center py-24 text-center">
      <ClearCart />
      <Suspense fallback={null}>
        <Completion
          title={labels.t("checkout_complete_title")}
          body={labels.t("checkout_complete_body")}
          demoTitle={labels.t("checkout_demo_title")}
          demoBody={labels.t("checkout_demo_body")}
        />
      </Suspense>
      <Link
        href="/collections"
        className="mt-10 inline-flex items-center justify-center border border-ink/25 px-8 py-3.5 text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-500 hover:border-ink hover:bg-ink hover:text-canvas"
      >
        {labels.t("checkout_complete_button")}
      </Link>
    </section>
  );
}
