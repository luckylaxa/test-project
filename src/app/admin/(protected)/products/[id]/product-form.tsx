"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, TextArea, TextInput, Toggle } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-field";
import { SaveBar, useEditor } from "@/components/admin/save-bar";
import { SortableList } from "@/components/admin/sortable";
import { Constants } from "@/lib/types/database";
import type { CollectionRow, ProductRow, ShadeRow } from "@/lib/content";
import { gallery } from "@/lib/section-content";
import type { Category } from "@/lib/try-on/makeup-renderer";
import { ShadeManager, type ShadeDraft } from "./shade-manager";
import { deleteProduct, saveProduct, saveRelated, saveShades } from "../actions";

type Form = {
  name: string;
  slug: string;
  collection_id: string;
  category: Category;
  short_description: string;
  details: string;
  ingredients: string;
  how_to_apply: string;
  price_display: string;
  shop_url: string;
  shop_label: string;
  is_bestseller: boolean;
  is_visible: boolean;
  seo_title: string;
  seo_description: string;
  images: { url: string; alt: string }[];
  shades: ShadeDraft[];
  related: string[];
};

export function ProductForm({
  product,
  shades,
  collections,
  allProducts,
  related,
  modelPhoto,
}: {
  product: ProductRow;
  shades: ShadeRow[];
  collections: CollectionRow[];
  allProducts: Pick<ProductRow, "id" | "name">[];
  related: string[];
  modelPhoto: string | null;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const editor = useEditor<Form>({
    name: product.name ?? "",
    slug: product.slug,
    collection_id: product.collection_id ?? "",
    category: product.category as Category,
    short_description: product.short_description ?? "",
    details: product.details ?? "",
    ingredients: product.ingredients ?? "",
    how_to_apply: product.how_to_apply ?? "",
    price_display: product.price_display ?? "",
    shop_url: product.shop_url ?? "",
    shop_label: product.shop_label ?? "",
    is_bestseller: product.is_bestseller,
    is_visible: product.is_visible,
    seo_title: product.seo_title ?? "",
    seo_description: product.seo_description ?? "",
    images: gallery(product.gallery),
    shades: shades.map((s) => ({
      key: s.id,
      id: s.id,
      name: s.name,
      hex: s.hex,
      finish: s.finish,
      default_intensity: Number(s.default_intensity),
      is_visible: s.is_visible,
    })),
    related,
  });

  const { value: v, set } = editor;

  const onSave = () =>
    editor.save(async (form) => {
      const saved = await saveProduct(
        product.id,
        {
          name: form.name,
          slug: form.slug,
          collection_id: form.collection_id || null,
          category: form.category,
          short_description: form.short_description || null,
          details: form.details || null,
          ingredients: form.ingredients || null,
          how_to_apply: form.how_to_apply || null,
          price_display: form.price_display || null,
          shop_url: form.shop_url || null,
          shop_label: form.shop_label || null,
          is_bestseller: form.is_bestseller,
          is_visible: form.is_visible,
          seo_title: form.seo_title || null,
          seo_description: form.seo_description || null,
          gallery: form.images,
        },
        form.slug,
      );
      if (!saved.ok) return saved;

      const shadesSaved = await saveShades(
        product.id,
        form.slug,
        form.shades.map((s) => ({
          id: s.id,
          name: s.name,
          hex: s.hex,
          finish: s.finish,
          default_intensity: s.default_intensity,
          is_visible: s.is_visible,
        })),
      );
      if (!shadesSaved.ok) return shadesSaved;

      const relatedSaved = await saveRelated(product.id, form.slug, form.related);
      if (!relatedSaved.ok) return relatedSaved;

      router.refresh();
      return { ok: true as const };
    });

  async function onDelete() {
    if (!window.confirm(`Delete "${v.name}" and all of its shades? This cannot be undone.`)) return;
    setDeleting(true);
    const result = await deleteProduct(product.id);
    if (result.ok) router.push("/admin/products");
    else setDeleting(false);
  }

  return (
    <div className="max-w-3xl">
      <Section title="The basics">
        <TextInput label="Product name" value={v.name} onChange={(x) => set("name", x)} max={60} />
        <TextInput
          label="Web address"
          help="The part of the link after /products/. Changing this breaks existing links."
          value={v.slug}
          onChange={(x) => set("slug", x.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
          max={60}
        />
        <Select
          label="Category"
          help="Decides where the shade is painted in the virtual try-on."
          value={v.category}
          onChange={(x) => set("category", x as Category)}
          options={Constants.public.Enums.product_category.map((c) => ({
            value: c,
            label: c.charAt(0).toUpperCase() + c.slice(1),
          }))}
        />
        <Select
          label="Collection"
          value={v.collection_id}
          onChange={(x) => set("collection_id", x)}
          options={[
            { value: "", label: "No collection" },
            ...collections.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <TextArea
          label="Short description"
          help="One or two sentences, shown on product cards and at the top of the page."
          value={v.short_description}
          onChange={(x) => set("short_description", x)}
          max={200}
          rows={3}
        />
        <TextInput
          label="Price"
          help="Shown as written. This site does not take payments, so any format is fine."
          value={v.price_display}
          onChange={(x) => set("price_display", x)}
          max={20}
        />
      </Section>

      <Section title="Photographs" help="The first image is used on product cards and when the page is shared.">
        <SortableList
          items={v.images.map((image, i) => ({ ...image, _key: `${i}` }))}
          getKey={(i) => i._key}
          onReorder={(next) => set("images", next.map(({ url, alt }) => ({ url, alt })))}
          renderItem={(image, index) => (
            <div className="space-y-3">
              <MediaField
                label={index === 0 ? "Main image" : `Image ${index + 1}`}
                value={image}
                onChange={(next) =>
                  set("images", v.images.map((img, i) => (i === index ? next : img)))
                }
              />
              <button
                type="button"
                onClick={() => set("images", v.images.filter((_, i) => i !== index))}
                className="text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase transition-colors hover:text-ink"
              >
                Remove image
              </button>
            </div>
          )}
        />
        <button
          type="button"
          onClick={() => set("images", [...v.images, { url: "", alt: "" }])}
          className="mt-3 border border-line px-4 py-2 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:border-ink"
        >
          Add an image
        </button>
      </Section>

      <Section
        title="Shades"
        help="Each shade can be tried on. The colour, finish and strength here are exactly what visitors will see on their own face."
      >
        <ShadeManager
          shades={v.shades}
          onChange={(x) => set("shades", x)}
          category={v.category}
          modelPhoto={modelPhoto}
        />
      </Section>

      <Section title="The details" help="These appear as drop-down panels on the product page. Leave any blank to hide it.">
        <TextArea label="Details" value={v.details} onChange={(x) => set("details", x)} rows={4} />
        <TextArea label="Ingredients" value={v.ingredients} onChange={(x) => set("ingredients", x)} rows={4} />
        <TextArea label="How to apply" value={v.how_to_apply} onChange={(x) => set("how_to_apply", x)} rows={4} />
      </Section>

      <Section title="Complete the look" help="Products suggested at the bottom of this page.">
        <div className="flex flex-wrap gap-2">
          {allProducts
            .filter((p) => p.id !== product.id)
            .map((p) => {
              const on = v.related.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    set(
                      "related",
                      on ? v.related.filter((id) => id !== p.id) : [...v.related, p.id],
                    )
                  }
                  aria-pressed={on}
                  className={`border px-3 py-1.5 text-xs transition-colors duration-200 ${
                    on ? "border-ink bg-ink text-canvas" : "border-line hover:border-ink"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
        </div>
      </Section>

      <Section title="Buying">
        <TextInput
          label="Button wording"
          help="Leave both fields empty to hide the button."
          value={v.shop_label}
          onChange={(x) => set("shop_label", x)}
          max={30}
        />
        <TextInput label="Button goes to" value={v.shop_url} onChange={(x) => set("shop_url", x)} />
      </Section>

      <Section title="Search engines">
        <TextInput
          label="Page title"
          help="Leave empty to use the product name."
          value={v.seo_title}
          onChange={(x) => set("seo_title", x)}
          max={60}
        />
        <TextArea
          label="Description"
          help="Leave empty to use the short description."
          value={v.seo_description}
          onChange={(x) => set("seo_description", x)}
          max={160}
          rows={3}
        />
      </Section>

      <Section title="Visibility">
        <Toggle
          label="Show on the website"
          help="Turn off to hide this product everywhere without deleting it."
          checked={v.is_visible}
          onChange={(x) => set("is_visible", x)}
        />
        <Toggle
          label="Feature as a bestseller"
          help="Bestsellers appear in the Most Worn section on the home page."
          checked={v.is_bestseller}
          onChange={(x) => set("is_bestseller", x)}
        />
        <div className="pt-4">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="text-[0.6875rem] tracking-[0.14em] text-red-700 uppercase transition-opacity hover:opacity-70 disabled:opacity-40"
          >
            {deleting ? "Deleting…" : "Delete this product"}
          </button>
        </div>
      </Section>

      <SaveBar
        dirty={editor.dirty}
        state={editor.state}
        error={editor.error}
        onSave={onSave}
        viewHref={`/products/${v.slug}`}
      />
    </div>
  );
}

function Section({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10 border-b border-line pb-10 last:border-0">
      <h2 className="font-[family-name:var(--font-display)] text-xl">{title}</h2>
      {help ? <p className="mt-1.5 mb-5 text-sm text-ink-muted">{help}</p> : <div className="mb-5" />}
      <div className="space-y-6">{children}</div>
    </section>
  );
}
