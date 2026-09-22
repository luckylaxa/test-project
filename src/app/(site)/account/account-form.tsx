"use client";

import { useState } from "react";
import type { Tables } from "@/lib/types/database";
import { saveCustomer } from "./actions";

const input =
  "w-full border border-line bg-canvas px-3 py-2.5 text-sm outline-none " +
  "transition-colors duration-200 focus:border-accent";

const COUNTRIES = [
  { value: "FR", label: "France" },
  { value: "GB", label: "United Kingdom" },
  { value: "IE", label: "Ireland" },
  { value: "DE", label: "Germany" },
  { value: "IT", label: "Italy" },
  { value: "ES", label: "Spain" },
  { value: "NL", label: "Netherlands" },
  { value: "BE", label: "Belgium" },
  { value: "US", label: "United States" },
  { value: "IN", label: "India" },
  { value: "AE", label: "United Arab Emirates" },
];


/**
 * Defined at module scope on purpose. A component declared inside another
 * component is a new type on every render, so React unmounts and remounts it —
 * which, for an input, means focus is lost after every keystroke.
 */
function Field({
  id,
  label,
  value,
  onChange,
  required = false,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-[0.6875rem] tracking-[0.14em] uppercase">
        {label}
      </label>
      <input
        id={id}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={input}
      />
    </div>
  );
}

export function AccountForm({
  customer,
  labels,
}: {
  customer: Tables<"customers"> | null;
  labels: {
    title: string;
    help: string;
    saved: string;
    save: string;
    fullName: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    postcode: string;
    country: string;
    countryEmpty: string;
  };
}) {
  const [form, setForm] = useState({
    full_name: customer?.full_name ?? "",
    phone: customer?.phone ?? "",
    address_line1: customer?.address_line1 ?? "",
    address_line2: customer?.address_line2 ?? "",
    city: customer?.city ?? "",
    postal_code: customer?.postal_code ?? "",
    country: customer?.country ?? "",
  });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setState("idle");
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("saving");
    setError(null);
    const result = await saveCustomer(form);
    if (result.ok) setState("saved");
    else {
      setError(result.error);
      setState("error");
    }
  }

  return (
    <form onSubmit={submit} className="mt-10 max-w-lg space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl">{labels.title}</h2>
        <p className="mt-1.5 text-sm text-ink-muted">{labels.help}</p>
      </div>

      <Field id="full_name" label={labels.fullName} value={form.full_name} onChange={set("full_name")} required autoComplete="name" />
      <Field id="phone" label={labels.phone} value={form.phone} onChange={set("phone")} autoComplete="tel" />
      <Field id="address_line1" label={labels.address1} value={form.address_line1} onChange={set("address_line1")} required autoComplete="address-line1" />
      <Field id="address_line2" label={labels.address2} value={form.address_line2} onChange={set("address_line2")} autoComplete="address-line2" />

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="city" label={labels.city} value={form.city} onChange={set("city")} required autoComplete="address-level2" />
        <Field id="postal_code" label={labels.postcode} value={form.postal_code} onChange={set("postal_code")} required autoComplete="postal-code" />
      </div>

      <div className="space-y-2">
        <label htmlFor="country" className="text-[0.6875rem] tracking-[0.14em] uppercase">
          {labels.country}
        </label>
        <select
          id="country"
          required
          value={form.country}
          autoComplete="country"
          onChange={(e) => set("country")(e.target.value)}
          className={input}
        >
          <option value="">{labels.countryEmpty}</option>
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-ink-soft">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={state === "saving"}
          className="bg-ink px-8 py-3.5 text-[0.6875rem] tracking-[0.2em] text-canvas uppercase transition-colors duration-500 hover:bg-accent hover:text-ink disabled:opacity-50"
        >
          {labels.save}
        </button>
        {state === "saved" ? (
          <span role="status" className="text-sm text-ink-muted">
            {labels.saved}
          </span>
        ) : null}
      </div>
    </form>
  );
}
