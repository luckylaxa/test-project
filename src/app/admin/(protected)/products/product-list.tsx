"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { SortableList } from "@/components/admin/sortable";
import type { ProductRow, ShadeRow } from "@/lib/content";
import { gallery } from "@/lib/section-content";
import { reorderProducts } from "./actions";

type Row = ProductRow & { shades: Pick<ShadeRow, "id" | "hex" | "is_visible">[] };

export function ProductList({ products }: { products: Row[] }) {
  const [order, setOrder] = useState(products);
  const [saving, setSaving] = useState(false);

  async function persist(next: Row[]) {
    setOrder(next);
    setSaving(true);
    await reorderProducts(next.map((p) => p.id));
    setSaving(false);
  }

  if (order.length === 0) {
    return <p className="text-sm text-ink-muted">No products yet. Add your first one above.</p>;
  }

  return (
    <div>
      <p className="mb-3 text-xs text-ink-muted" role="status">
        {saving ? "Saving order…" : "Drag to reorder. The order here is the order on the website."}
      </p>
      <SortableList
        items={order}
        getKey={(p) => p.id}
        onReorder={persist}
        renderItem={(product) => {
          const cover = gallery(product.gallery)[0];
          const shades = product.shades.filter((s) => s.is_visible);
          return (
            <Link href={`/admin/products/${product.id}`} className="flex items-center gap-4">
              <span className="relative h-14 w-12 shrink-0 overflow-hidden bg-canvas-soft">
                {cover ? (
                  <Image
                    src={cover.url}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                    unoptimized={cover.url.endsWith(".svg")}
                  />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-[family-name:var(--font-display)] text-lg">
                  {product.name}
                </span>
                <span className="block text-[0.625rem] tracking-[0.12em] text-ink-muted uppercase">
                  {product.category} · {shades.length} shade{shades.length === 1 ? "" : "s"}
                  {product.is_bestseller ? " · bestseller" : ""}
                  {product.is_visible ? "" : " · hidden"}
                </span>
              </span>
              <span className="flex shrink-0 gap-1">
                {shades.slice(0, 6).map((shade) => (
                  <span
                    key={shade.id}
                    className="h-3.5 w-3.5 rounded-full ring-1 ring-ink/10"
                    style={{ background: shade.hex }}
                  />
                ))}
              </span>
            </Link>
          );
        }}
      />
    </div>
  );
}
