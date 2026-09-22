import type { Order } from "@/lib/orders";
import { formatMoney } from "@/lib/cart/types";

/**
 * A customer's own orders.
 *
 * Read back from the payment provider rather than a table of ours, so an order
 * appears here even when the browser closed before it could show a
 * confirmation.
 */
export function Orders({
  orders,
  labels,
}: {
  orders: Order[] | null;
  labels: { title: string; empty: string; unavailable: string; paid: string; refunded: string };
}) {
  return (
    <section className="mt-16 max-w-2xl">
      <h2 className="font-[family-name:var(--font-display)] text-xl">{labels.title}</h2>

      {orders === null ? (
        <p className="mt-4 text-sm text-ink-muted">{labels.unavailable}</p>
      ) : orders.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">{labels.empty}</p>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {orders.map((order) => (
            <li key={order.paymentId} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-5">
              <div className="min-w-0">
                {order.items ? <p className="text-sm">{order.items}</p> : null}
                <p className="mt-1 text-xs text-ink-muted">
                  <time dateTime={order.createdAt}>
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">{formatMoney(order.amount, order.currency)}</p>
                <p className="mt-1 text-[0.625rem] tracking-[0.16em] text-ink-muted uppercase">
                  {order.refunded > 0 ? labels.refunded : labels.paid}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
