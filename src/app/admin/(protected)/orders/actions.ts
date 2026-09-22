"use server";

import { withAdmin, type ActionResult } from "@/lib/admin/actions";
import { tags } from "@/lib/cache-tags";

const STATUSES = [
  "placed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

/**
 * Records where an order has got to.
 *
 * `user_id` comes from the payment's own notes, which only the server reads —
 * the form supplies the payment id, not the owner, so this cannot be used to
 * attach a stranger's order to someone else. `withAdmin` re-checks the admin
 * before anything is written.
 */
export async function saveOrderStatus(input: {
  paymentId: string;
  userId: string;
  status: string;
  courier: string;
  trackingNumber: string;
  trackingUrl: string;
  note: string;
}): Promise<ActionResult> {
  if (!STATUSES.includes(input.status as (typeof STATUSES)[number])) {
    return { ok: false, error: "That is not a status this shop uses." };
  }

  const url = input.trackingUrl.trim();
  if (url && !/^https?:\/\//i.test(url)) {
    return { ok: false, error: "A tracking link must start with http:// or https://" };
  }

  return withAdmin([tags.settings], (supabase) =>
    supabase.from("order_status").upsert(
      {
        payment_id: input.paymentId,
        user_id: input.userId,
        status: input.status,
        courier: input.courier.trim() || null,
        tracking_number: input.trackingNumber.trim() || null,
        tracking_url: url || null,
        note: input.note.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "payment_id" },
    ),
  );
}
