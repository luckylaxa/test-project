"use client";

import { TextArea, TextInput } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-field";
import { SortableList } from "@/components/admin/sortable";
import { obj, text } from "@/lib/section-content";
import type { Json } from "@/lib/types/database";
import type { Database } from "@/lib/types/database";

type SectionType = Database["public"]["Enums"]["section_type"];
type Obj = Record<string, Json | undefined>;

/** Plain-language name and explanation for each kind of section. */
export const SECTION_INFO: Record<SectionType, { label: string; help: string }> = {
  hero: { label: "Opening banner", help: "The full-width image or video at the top of a page, with a headline and up to two buttons." },
  collections: { label: "Collections", help: "Cards for every visible collection." },
  bestsellers: { label: "Bestsellers", help: "Products you have marked as a bestseller in the product editor." },
  looks: { label: "Curated looks", help: "Cards for every visible look, each opening the try-on." },
  try_on_feature: { label: "Try-on feature", help: "A dark band inviting people into the virtual try-on." },
  brand_story: { label: "Brand story", help: "A large image beside a paragraph about the maison." },
  image_text: { label: "Image and text", help: "The same layout as the brand story, for any other subject." },
  craft: { label: "Craft highlights", help: "A row of short titled notes, four reads best." },
  testimonials: { label: "Testimonials", help: "Quotes managed on the Testimonials screen." },
  press: { label: "Press logos", help: "The “As seen in” row, managed on the Press screen." },
  newsletter: { label: "Newsletter signup", help: "The email signup band." },
  rich_text: { label: "Long text", help: "Formatted paragraphs, used for pages like Privacy." },
  contact_details: { label: "Contact details", help: "Pulls your email, telephone and address from Site settings." },
  contact_form: { label: "Enquiry form", help: "The form that sends messages to the Enquiries screen." },
};

const linkPair = (value: Obj) => ({
  label: text(value.label) ?? "",
  href: text(value.href) ?? "",
});

/**
 * The editor for one section's content.
 *
 * Each section type has its own shape (see CLAUDE.md), so each gets its own set
 * of fields rather than a generic JSON box no editor could use.
 */
export function SectionFields({
  type,
  content,
  onChange,
}: {
  type: SectionType;
  content: Json;
  onChange: (content: Json) => void;
}) {
  const c = obj(content);
  const set = (patch: Record<string, Json>) => onChange({ ...c, ...patch } as Json);

  const str = (key: string) => text(c[key]) ?? "";

  const Eyebrow = (
    <TextInput
      label="Small label above the headline"
      help="Optional. Shown in tiny spaced-out capitals."
      value={str("eyebrow")}
      onChange={(x) => set({ eyebrow: x })}
      max={40}
    />
  );
  const Headline = (
    <TextInput label="Headline" value={str("headline")} onChange={(x) => set({ headline: x })} max={70} />
  );
  const Subtext = (
    <TextArea
      label="Supporting sentence"
      value={str("subtext")}
      onChange={(x) => set({ subtext: x })}
      max={240}
      rows={3}
    />
  );

  const LinkFields = (key: string, label: string) => {
    const link = linkPair(obj(c[key]));
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label={`${label} wording`}
          help="Leave empty to hide the button."
          value={link.label}
          onChange={(x) => set({ [key]: { label: x, href: link.href } })}
          max={30}
        />
        <TextInput
          label={`${label} goes to`}
          value={link.href}
          onChange={(x) => set({ [key]: { label: link.label, href: x } })}
        />
      </div>
    );
  };

  const ImageField = (key: string, label: string, help?: string) => {
    const image = obj(c[key]);
    return (
      <MediaField
        label={label}
        help={help}
        value={{ url: text(image.url) ?? "", alt: text(image.alt) ?? "" }}
        onChange={(x) => set({ [key]: { url: x.url, alt: x.alt } })}
      />
    );
  };

  switch (type) {
    case "hero": {
      const media = obj(c.media);
      return (
        <>
          {Eyebrow}
          {Headline}
          {Subtext}
          <MediaField
            label="Background image or video"
            help="Fills the whole banner. A quiet, well-lit photograph works best — text sits over it."
            value={{ url: text(media.url) ?? "", alt: text(media.alt) ?? "" }}
            onChange={(x) =>
              set({ media: { type: /\.(mp4|webm)$/i.test(x.url) ? "video" : "image", url: x.url, alt: x.alt, poster_url: null } })
            }
            accept="image/*,video/mp4,video/webm"
          />
          {LinkFields("primary_button", "Main button")}
          {LinkFields("secondary_button", "Second button")}
        </>
      );
    }

    case "collections":
    case "looks":
    case "bestsellers":
      return (
        <>
          {Eyebrow}
          {Headline}
          {Subtext}
          {type === "bestsellers" ? (
            <TextInput
              label="How many to show"
              help="Leave empty to show every bestseller. Which products appear is set on each product."
              value={c.limit === undefined || c.limit === null ? "" : String(c.limit)}
              onChange={(x) => set({ limit: x === "" ? null : Number(x.replace(/\D/g, "")) || null })}
            />
          ) : null}
          {LinkFields("link", "Link at the top right")}
        </>
      );

    case "try_on_feature":
      return (
        <>
          {Eyebrow}
          {Headline}
          {Subtext}
          {ImageField("image", "Image")}
          {LinkFields("button", "Button")}
        </>
      );

    case "brand_story":
    case "image_text":
      return (
        <>
          {Eyebrow}
          {Headline}
          <TextArea label="Paragraph" value={str("body")} onChange={(x) => set({ body: x })} rows={5} max={600} />
          {ImageField("image", "Image")}
          <div className="flex gap-2">
            {(["left", "right"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => set({ image_side: side })}
                aria-pressed={(str("image_side") || "left") === side}
                className={`border px-4 py-2 text-[0.6875rem] tracking-[0.14em] uppercase transition-colors ${
                  (str("image_side") || "left") === side
                    ? "border-ink bg-ink text-canvas"
                    : "border-line hover:border-ink"
                }`}
              >
                Image on the {side}
              </button>
            ))}
          </div>
          {LinkFields("button", "Button")}
        </>
      );

    case "craft": {
      const items = Array.isArray(c.items) ? (c.items as Obj[]) : [];
      const setItems = (next: Obj[]) => set({ items: next as unknown as Json });
      return (
        <>
          {Eyebrow}
          {Headline}
          {Subtext}
          <div>
            <p className="mb-3 text-[0.6875rem] tracking-[0.14em] uppercase">Highlights</p>
            <SortableList
              items={items.map((item, i) => ({ item, _key: `${i}` }))}
              getKey={(x) => x._key}
              onReorder={(next) => setItems(next.map((x) => x.item))}
              renderItem={({ item }, index) => (
                <div className="space-y-3">
                  <TextInput
                    label="Title"
                    value={text(item.title) ?? ""}
                    onChange={(x) =>
                      setItems(items.map((it, i) => (i === index ? { ...it, title: x } : it)))
                    }
                    max={40}
                  />
                  <TextArea
                    label="Description"
                    value={text(item.description) ?? ""}
                    onChange={(x) =>
                      setItems(items.map((it, i) => (i === index ? { ...it, description: x } : it)))
                    }
                    rows={2}
                    max={200}
                  />
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((_, i) => i !== index))}
                    className="text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase hover:text-ink"
                  >
                    Remove
                  </button>
                </div>
              )}
            />
            <button
              type="button"
              onClick={() => setItems([...items, { title: "", description: "" }])}
              className="mt-3 border border-line px-4 py-2 text-[0.6875rem] tracking-[0.16em] uppercase hover:border-ink"
            >
              Add a highlight
            </button>
          </div>
        </>
      );
    }

    case "testimonials":
    case "press":
      return (
        <>
          {Eyebrow}
          {Headline}
          <p className="text-sm text-ink-muted">
            The entries themselves are managed on their own screen in the menu.
          </p>
        </>
      );

    case "newsletter":
      return (
        <>
          {Eyebrow}
          {Headline}
          {Subtext}
          <TextInput label="Placeholder in the email box" value={str("placeholder")} onChange={(x) => set({ placeholder: x })} max={40} />
          <TextInput label="Button wording" value={str("button_label")} onChange={(x) => set({ button_label: x })} max={30} />
          <TextArea label="Thank-you message" value={str("success_message")} onChange={(x) => set({ success_message: x })} rows={2} max={200} />
          <TextArea label="Small print" value={str("consent_text")} onChange={(x) => set({ consent_text: x })} rows={2} max={200} />
        </>
      );

    case "contact_details":
      return (
        <>
          {Eyebrow}
          {Headline}
          {Subtext}
          <p className="text-sm text-ink-muted">
            The email, telephone and address themselves come from Site settings.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextInput label="Email label" value={str("email_label")} onChange={(x) => set({ email_label: x })} max={24} />
            <TextInput label="Telephone label" value={str("phone_label")} onChange={(x) => set({ phone_label: x })} max={24} />
            <TextInput label="Address label" value={str("address_label")} onChange={(x) => set({ address_label: x })} max={24} />
          </div>
        </>
      );

    case "contact_form":
      return (
        <>
          {Eyebrow}
          {Headline}
          {Subtext}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Name field label" value={str("name_label")} onChange={(x) => set({ name_label: x })} max={30} />
            <TextInput label="Email field label" value={str("email_label")} onChange={(x) => set({ email_label: x })} max={30} />
            <TextInput label="Subject field label" value={str("subject_label")} onChange={(x) => set({ subject_label: x })} max={30} />
            <TextInput label="Message field label" value={str("message_label")} onChange={(x) => set({ message_label: x })} max={30} />
          </div>
          <TextInput label="Button wording" value={str("button_label")} onChange={(x) => set({ button_label: x })} max={30} />
          <TextArea label="Thank-you message" value={str("success_message")} onChange={(x) => set({ success_message: x })} rows={2} max={240} />
          <TextArea label="Small print" value={str("consent_text")} onChange={(x) => set({ consent_text: x })} rows={2} max={200} />
        </>
      );

    case "rich_text":
      return (
        <>
          {Eyebrow}
          {Headline}
          <TextArea
            label="Text"
            help="Basic formatting is allowed: paragraphs, headings and links."
            value={str("body_html")}
            onChange={(x) => set({ body_html: x })}
            rows={12}
          />
        </>
      );

    default:
      return null;
  }
}
