"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Constants } from "@/lib/types/database";
import type { Category } from "@/lib/try-on/makeup-renderer";
import { createProduct } from "./actions";

/** Creates a product with the minimum needed, then opens the full editor. */
export function NewProduct() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("lips");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  async function create() {
    if (!slug) return;
    setBusy(true);
    setError(null);
    const result = await createProduct({ name, slug, category, is_visible: false });
    if (result.ok && result.id) {
      router.push(`/admin/products/${result.id}`);
      return;
    }
    setError(result.ok ? "Could not create the product." : result.error);
    setBusy(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-ink px-5 py-2.5 text-[0.6875rem] tracking-[0.16em] text-canvas uppercase transition-colors duration-300 hover:bg-accent hover:text-ink"
      >
        Add a product
      </button>
    );
  }

  return (
    <div className="w-full max-w-md border border-line p-5">
      <p className="mb-4 text-[0.6875rem] tracking-[0.14em] uppercase">New product</p>
      <div className="space-y-4">
        <input
          autoFocus
          value={name}
          placeholder="Product name"
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="w-full border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-accent"
        >
          {Constants.public.Enums.product_category.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <p className="text-xs text-ink-muted">
          It starts hidden, so you can add shades and photographs before anyone sees it.
        </p>
        {error ? <p className="text-xs text-red-700">{error}</p> : null}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={create}
            disabled={busy || !slug}
            className="bg-ink px-5 py-2.5 text-[0.6875rem] tracking-[0.16em] text-canvas uppercase disabled:opacity-40"
          >
            {busy ? "Creating…" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2.5 text-[0.6875rem] tracking-[0.16em] text-ink-muted uppercase hover:text-ink"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
