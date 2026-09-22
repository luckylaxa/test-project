import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/cart/types";

export type SavedItem = {
  id: string;
  name: string;
  slug: string;
  priceAmount: number | null;
  image: string | null;
  imageAlt: string;
};

/** What the customer has saved for later. */
export function Saved({
  items,
  currency,
  labels,
}: {
  items: SavedItem[];
  currency: string;
  labels: { title: string; empty: string };
}) {
  return (
    <section className="mt-16 max-w-2xl">
      <h2 className="font-[family-name:var(--font-display)] text-2xl">{labels.title}</h2>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">{labels.empty}</p>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/products/${item.slug}`} className="group block">
                <div className="relative aspect-4/5 overflow-hidden bg-canvas-soft">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      fill
                      sizes="(min-width: 640px) 20rem, 90vw"
                      className="object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <p className="mt-3 text-sm">{item.name}</p>
                {item.priceAmount ? (
                  <p className="mt-1 text-sm text-ink-muted">
                    {formatMoney(item.priceAmount, currency)}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
