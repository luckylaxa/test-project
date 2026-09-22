import { AdminHeader } from "@/components/admin/shell";
import { CsvExport } from "@/components/admin/csv-export";
import { requireAdmin } from "@/lib/admin/guard";
import { listOrders } from "@/lib/orders";
import { formatMoney } from "@/lib/cart/types";
import { OrderRow } from "./order-row";

export const instant = false;

export default async function OrdersPage() {
  // Authorization is checked here, not only in the layout: layouts and
  // pages render in parallel, so a page can query before a layout redirect
  // lands.
  await requireAdmin();

  // Failed and abandoned attempts are worth seeing here — they are how you
  // notice a payment method rejecting everyone.
  const orders = await listOrders({ includeUnpaid: true });
  const paid = (orders ?? []).filter((o) => o.paid);

  if (orders === null) {
    return (
      <>
        <AdminHeader title="Orders" description="Payments taken through the website." />
        <p className="max-w-lg text-sm text-ink-muted">
          Orders could not be read from Razorpay. Check that the payment keys are set on the
          server. Any order that has been placed is safe — this screen only reads.
        </p>
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title="Orders"
        description={
          paid.length > 0
            ? `${paid.length} paid order${paid.length === 1 ? "" : "s"}. Razorpay holds the full record, including refunds.`
            : "Payments taken through the website."
        }
        action={
          <CsvExport
            rows={orders.map((o) => ({
              placed: o.createdAt,
              status: o.status,
              amount: (o.amount / 100).toFixed(2),
              currency: o.currency,
              items: o.items ?? "",
              deliver_to: o.deliverTo ?? "",
              email: o.email ?? "",
              contact: o.contact ?? "",
              method: o.method ?? "",
              payment_id: o.paymentId,
            }))}
            columns={[
              { key: "placed", header: "Placed" },
              { key: "status", header: "Status" },
              { key: "amount", header: "Amount" },
              { key: "currency", header: "Currency" },
              { key: "items", header: "Items" },
              { key: "deliver_to", header: "Deliver to" },
              { key: "email", header: "Email" },
              { key: "contact", header: "Telephone" },
              { key: "method", header: "Method" },
              { key: "payment_id", header: "Payment reference" },
            ]}
            filename={`orders-${new Date().toISOString().slice(0, 10)}.csv`}
          />
        }
      />

      {orders.length === 0 ? (
        <p className="text-sm text-ink-muted">No orders yet.</p>
      ) : (
        <ul className="max-w-3xl border-t border-line">
          {orders.map((order) => (
            <OrderRow key={order.paymentId} order={order}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <p className="text-sm">{order.items ?? "—"}</p>
                <p className="text-sm">{formatMoney(order.amount, order.currency)}</p>
              </div>

              <p className="mt-1.5 text-xs text-ink-muted">
                <time dateTime={order.createdAt}>
                  {new Date(order.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
                {" · "}
                <span className={order.paid ? "text-ink" : undefined}>
                  {order.refunded > 0 ? "Refunded" : order.paid ? "Paid" : order.status}
                </span>
                {order.method ? ` · ${order.method}` : ""}
                {order.instrument ? ` · ${order.instrument}` : ""}
              </p>

              {order.deliverTo ? (
                <p className="mt-2 text-sm text-ink-soft">{order.deliverTo}</p>
              ) : null}

              <p className="mt-1 text-xs text-ink-muted">
                {[order.email, order.contact].filter(Boolean).join(" · ")}
              </p>

              <p className="mt-2 font-mono text-[0.6875rem] text-ink-muted">{order.paymentId}</p>
            </OrderRow>
          ))}
        </ul>
      )}
    </>
  );
}
