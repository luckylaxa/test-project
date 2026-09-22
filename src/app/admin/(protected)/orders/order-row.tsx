"use client";

import { useState } from "react";
import { Select, TextInput } from "@/components/admin/fields";
import type { Order } from "@/lib/orders";
import { saveOrderStatus } from "./actions";

const STATUS_OPTIONS = [
  { value: "placed", label: "Order placed" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

/** One order, with the fulfilment fields the customer will see. */
export function OrderRow({ order, children }: { order: Order; children: React.ReactNode }) {
  const f = order.fulfilment;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    status: f?.status ?? "placed",
    courier: f?.courier ?? "",
    trackingNumber: f?.trackingNumber ?? "",
    trackingUrl: f?.trackingUrl ?? "",
    note: f?.note ?? "",
  });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setState("idle");
  };

  async function save() {
    // Without an owner there is nobody to show this to, so refuse rather than
    // writing a row no customer can ever read.
    if (!order.userId) {
      setError("This payment has no customer recorded, so it cannot be tracked.");
      setState("error");
      return;
    }
    setState("saving");
    setError(null);
    const result = await saveOrderStatus({ paymentId: order.paymentId, userId: order.userId, ...form });
    if (result.ok) setState("saved");
    else {
      setError(result.error);
      setState("error");
    }
  }

  return (
    <li className="border-b border-line py-5">
      {children}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="tap-sm mt-3 text-[0.6875rem] tracking-[0.16em] uppercase underline underline-offset-4"
      >
        {open ? "Close" : f ? `Delivery: ${STATUS_OPTIONS.find((s) => s.value === f.status)?.label ?? f.status}` : "Set delivery status"}
      </button>

      {open ? (
        <div className="mt-4 max-w-lg space-y-5 border border-line p-5">
          <Select
            label="Where is this order?"
            help="The customer sees this on their account page as soon as you save."
            value={form.status}
            onChange={set("status")}
            options={STATUS_OPTIONS}
          />
          <TextInput label="Courier" value={form.courier} onChange={set("courier")} max={60} />
          <TextInput
            label="Tracking number"
            value={form.trackingNumber}
            onChange={set("trackingNumber")}
            max={80}
          />
          <TextInput
            label="Tracking link"
            help="The courier's own tracking page. Must start with https://"
            value={form.trackingUrl}
            onChange={set("trackingUrl")}
            max={300}
          />
          <TextInput
            label="Note to the customer"
            help="Optional. Shown with the tracking details."
            value={form.note}
            onChange={set("note")}
            max={200}
          />

          {error ? (
            <p role="alert" className="text-sm text-ink-soft">
              {error}
            </p>
          ) : null}

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={save}
              disabled={state === "saving"}
              className="bg-ink px-6 py-2.5 text-[0.6875rem] tracking-[0.16em] text-canvas uppercase transition-colors duration-300 hover:bg-accent hover:text-ink disabled:opacity-40"
            >
              Save
            </button>
            {state === "saved" ? (
              <span role="status" className="text-sm text-ink-muted">
                Saved. The customer can see it now.
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}
