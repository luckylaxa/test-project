import { FULFILMENT_STEPS, type Order } from "@/lib/orders";
import { formatMoney } from "@/lib/cart/types";

export type OrderLabels = {
  title: string;
  empty: string;
  unavailable: string;
  paid: string;
  refunded: string;
  trackingTitle: string;
  courier: string;
  trackingNumber: string;
  trackingLink: string;
  refundNote: string;
  refundPartial: string;
  /** One per status key, so every word a customer reads stays editable. */
  step: Record<string, string>;
};

/**
 * A customer's own orders, with where each one has got to.
 *
 * Payment comes from Razorpay, delivery from `order_status`. An order the
 * brand team has not touched yet is shown as placed rather than as unknown —
 * paying for something is what places it.
 */
export function Orders({ orders, labels }: { orders: Order[] | null; labels: OrderLabels }) {
  return (
    <section className="mt-16 max-w-2xl">
      <h2 className="font-[family-name:var(--font-display)] text-2xl">{labels.title}</h2>

      {orders === null ? (
        <p className="mt-4 text-sm text-ink-muted">{labels.unavailable}</p>
      ) : orders.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">{labels.empty}</p>
      ) : (
        <ul className="mt-6 space-y-10">
          {orders.map((order) => (
            <li key={order.paymentId} className="border-t border-line pt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                {order.items ? <p className="text-sm">{order.items}</p> : <span />}
                <p className="text-sm">{formatMoney(order.amount, order.currency)}</p>
              </div>

              <p className="mt-1 text-xs text-ink-muted">
                <time dateTime={order.createdAt}>
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                {" · "}
                {order.refunded > 0 ? labels.refunded : labels.paid}
              </p>

              {order.refunded > 0 ? (
                <p className="mt-3 border border-line px-4 py-3 text-sm text-ink-soft">
                  {order.refunded >= order.amount ? labels.refundNote : labels.refundPartial}
                </p>
              ) : (
                <Progress order={order} labels={labels} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The parcel's journey. Cancelled leaves the track entirely, so it is separate. */
function Progress({ order, labels }: { order: Order; labels: OrderLabels }) {
  const status = order.fulfilment?.status ?? "placed";

  if (status === "cancelled") {
    return (
      <p className="mt-3 border border-line px-4 py-3 text-sm text-ink-soft">
        {labels.step.cancelled}
      </p>
    );
  }

  const reached = Math.max(0, FULFILMENT_STEPS.indexOf(status as (typeof FULFILMENT_STEPS)[number]));
  const f = order.fulfilment;

  return (
    <div className="mt-5">
      <ol className="flex flex-wrap gap-x-2 gap-y-3">
        {FULFILMENT_STEPS.map((step, i) => {
          const done = i <= reached;
          return (
            <li key={step} className="flex min-w-0 flex-1 basis-24 flex-col gap-2">
              <span
                aria-hidden
                className={`h-0.5 w-full ${done ? "bg-accent" : "bg-line"}`}
              />
              <span
                className={`text-[0.6875rem] leading-tight tracking-[0.08em] uppercase ${
                  done ? "font-medium text-ink" : "text-ink-muted"
                }`}
              >
                {labels.step[step]}
                {/* Spoken, not shown: the bar alone means nothing to a screen reader. */}
                {i === reached ? <span className="sr-only"> — current</span> : null}
              </span>
            </li>
          );
        })}
      </ol>

      {f?.courier || f?.trackingNumber || f?.trackingUrl ? (
        <div className="mt-5 border border-line px-4 py-4 text-sm">
          <p className="eyebrow">{labels.trackingTitle}</p>
          <dl className="mt-3 space-y-1.5">
            {f.courier ? (
              <div className="flex gap-3">
                <dt className="text-ink-muted">{labels.courier}</dt>
                <dd>{f.courier}</dd>
              </div>
            ) : null}
            {f.trackingNumber ? (
              <div className="flex gap-3">
                <dt className="text-ink-muted">{labels.trackingNumber}</dt>
                <dd className="font-mono text-[0.8125rem]">{f.trackingNumber}</dd>
              </div>
            ) : null}
          </dl>
          {f.trackingUrl ? (
            <a
              href={f.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-sm mt-3 text-[0.6875rem] tracking-[0.16em] uppercase underline underline-offset-4 transition-colors hover:text-accent-text"
            >
              {labels.trackingLink}
            </a>
          ) : null}
          {f.note ? <p className="mt-3 text-ink-soft">{f.note}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
