/**
 * Orders, read back from Razorpay.
 *
 * There is no orders table. Razorpay already holds every payment, and each one
 * carries the customer's id in its notes, so reading from there keeps a single
 * record of truth and avoids a privileged writer — this project never uses the
 * Supabase service role key.
 *
 * It also closes a real gap: verification happens in the customer's browser, so
 * someone who pays and closes the tab never sees a confirmation. Their payment
 * still shows up here, for them and for the brand team.
 *
 * Server-side only. The key secret has no NEXT_PUBLIC_ prefix, so it is
 * undefined in the browser and a listing would simply come back null — but
 * import this from server components and actions only.
 */

export type Order = {
  paymentId: string;
  orderId: string | null;
  status: string;
  /** True only for money actually taken. */
  paid: boolean;
  amount: number;
  currency: string;
  method: string | null;
  /** Last four digits, bank or wallet — whatever identifies how they paid. */
  instrument: string | null;
  email: string | null;
  contact: string | null;
  items: string | null;
  deliverTo: string | null;
  userId: string | null;
  createdAt: string;
  refunded: number;
};

type RazorpayPayment = {
  id: string;
  order_id: string | null;
  status: string;
  captured: boolean;
  amount: number;
  currency: string;
  method: string | null;
  card?: { last4?: string | null; network?: string | null } | null;
  bank?: string | null;
  wallet?: string | null;
  vpa?: string | null;
  email?: string | null;
  contact?: string | null;
  notes?: Record<string, string> | null;
  created_at: number;
  amount_refunded?: number;
};

/**
 * How far back a listing reaches. Razorpay cannot filter by notes, so a
 * customer's orders are found by scanning the most recent payments. Beyond this
 * many payments overall, older orders stop appearing and a real orders table
 * would be needed.
 */
const WINDOW = 100;

function instrumentOf(p: RazorpayPayment): string | null {
  if (p.card?.last4) return `${p.card.network ?? ""} ${p.card.last4}`.trim();
  return p.bank || p.wallet || p.vpa || null;
}

function toOrder(p: RazorpayPayment): Order {
  return {
    paymentId: p.id,
    orderId: p.order_id,
    status: p.status,
    paid: p.status === "captured" || p.captured === true,
    amount: p.amount,
    currency: p.currency,
    method: p.method,
    instrument: instrumentOf(p),
    email: p.email ?? null,
    contact: p.contact ?? null,
    items: p.notes?.items ?? null,
    deliverTo: p.notes?.deliver_to ?? null,
    userId: p.notes?.user_id ?? null,
    createdAt: new Date(p.created_at * 1000).toISOString(),
    refunded: p.amount_refunded ?? 0,
  };
}

/**
 * Recent payments. `userId` narrows to one customer's own orders — pass it for
 * anything a customer can see, so one person's orders can never reach another.
 */
export async function listOrders({
  userId,
  includeUnpaid = false,
}: { userId?: string; includeUnpaid?: boolean } = {}): Promise<Order[] | null> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  // Null, not empty: "payments cannot be read" and "there are none" are
  // different things, and the screens word them differently.
  if (!keyId || !keySecret) return null;

  try {
    const response = await fetch(`https://api.razorpay.com/v1/payments?count=${WINDOW}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const body = (await response.json()) as { items?: RazorpayPayment[] };
    let orders = (body.items ?? []).map(toOrder);

    if (userId) orders = orders.filter((o) => o.userId === userId);
    if (!includeUnpaid) orders = orders.filter((o) => o.paid);

    return orders;
  } catch {
    return null;
  }
}
