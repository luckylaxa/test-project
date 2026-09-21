# Velmora Beauté — project rules

Ultra-luxury cosmetics website with a real-time, in-browser virtual makeup try-on.
A non-technical brand team must be able to run the entire site from `/admin`, with no
developer involvement.

---

## THE MOST IMPORTANT RULE

**No hardcoded content in the public website.**

Every headline, paragraph, image, video, product, shade, collection, look, button label,
link and SEO field comes from Supabase and is editable in the admin panel.

This means:

- No literal copy in a public component. If a human would want to reword it, it is a field.
- Button labels and their `href`s are content, not code.
- Navigation, footer links, social links, legal links, contact details — all content.
- SEO titles, descriptions and Open Graph images — content, with fallbacks to `site_settings`.
- Every component must render gracefully when an optional field is empty or a list has
  zero items. Never assume an image, a subtitle or a second button exists.
- Layout, typography and spacing are **not** content. Editors change words, media, order and
  visibility, plus the accent colour — nothing else.

The only strings allowed in the codebase are admin-panel UI chrome (labels, help text,
validation messages) and unavoidable technical text.

Phase 7 includes a sweep of the codebase for content that slipped into code.

---

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 — tokens live in `src/app/globals.css`
- Supabase: database, auth, storage — always via `@supabase/ssr`
- `@mediapipe/tasks-vision` Face Landmarker for the try-on, 100% in the browser
- Vercel, auto-deploying from `main`
- Free and open-source only. Keep the dependency list short.

## Security rules

- **Never** use or request the Supabase service role / secret key. Only
  `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Row Level Security on every table, with no exceptions.
- Public/anonymous access: read only visible/published rows; insert only into
  `newsletter_subscribers` and `enquiries`, with validation and a honeypot field.
- Admins are rows in `admins`. Only they can write anything else, or upload to storage.
- Public sign-ups are disabled — admin users are created in the Supabase dashboard.
- `.env.local` is gitignored and never committed.

## Privacy rule for the try-on

Camera frames and uploaded photos **never leave the browser**. Nothing is uploaded, logged
or stored. The camera stream is stopped when leaving the studio and processing pauses when
the tab is hidden. Any change that would send image data anywhere is a bug.

## Design direction

A high-end Parisian beauty maison: editorial, calm, confident, expensive.

- Display serif (Cormorant Garamond) for headlines; refined sans (Jost) for body and UI.
- Palette: warm ivory, deep black, champagne gold accent, muted nudes. The accent colour is
  the one visual token editors control, via `site_settings.accent_color`.
- Generous whitespace, full-bleed editorial imagery, asymmetric magazine compositions,
  hairline dividers. No heavy shadows, no loud gradients, no clutter.
- Motion is slow and subtle, and always respects `prefers-reduced-motion`.
- Mobile first. Check 375, 768, 1280 and 1600px. The try-on must feel excellent on a phone.
- Accessible: semantic HTML, alt text on every image, keyboard navigation, visible focus,
  real contrast even with a soft palette.
- Fast: `next/image`, lazy loading, and the MediaPipe model loads only on try-on views.

## Content freshness and SEO

- Public pages are static / ISR and update within seconds of "Save & Publish" via
  on-demand revalidation (`revalidatePath` / `revalidateTag`). Content edits never require
  a redeploy.
- Metadata comes from Supabase, falling back to `site_settings`.
- Product pages carry JSON-LD. `sitemap.xml` and `robots.txt` exist; `/admin` is not indexed.

## Working rules

- Explain any database change, deletion or push before doing it.
- Commit at the end of each phase with a clear message.
- Develop on the branch `claude/optimistic-tesla-87m7xi`.
- Ask one question at a time rather than guessing.

## Layout of the code

```
src/
  app/            routes — public pages, /try-on, /admin, sitemap, robots
  components/
    layout/       header, footer
    sections/     home and page section renderers, one per section type
    try-on/       studio UI and makeup rendering
    ui/           shared primitives (buttons, fields, accordions)
  lib/
    supabase/     client (browser) · server (SSR) · public (ISR, cookie-free)
    types/        database types, generated from the live schema
```

---

## Database (applied in Phase 2)

Migrations are applied through the Supabase MCP and stored in the project
(`supabase_migrations.schema_migrations`). Applied so far:

| Version | Name |
|---|---|
| 20260921085326 | velmora_schema |
| 20260921085349 | velmora_rls |
| 20260921085406 | velmora_storage |
| 20260921085534 | velmora_lock_down_is_admin |
| 20260921085654 | velmora_seed_catalogue |
| 20260921085727 | velmora_seed_shades |
| 20260921085826 | velmora_seed_looks_and_editorial |
| 20260921085931 | velmora_seed_pages_and_sections |

After any migration, regenerate `src/lib/types/database.ts` from the live schema
(Supabase MCP `generate_typescript_types`) rather than editing it by hand.

### Section content shapes

`sections.content` is jsonb, keyed by `sections.type`. Renderers must treat every
field as optional.

- `hero` — eyebrow, headline, subtext, media {type,url,alt,poster_url},
  primary_button {label,href}, secondary_button {label,href}
- `collections` / `looks` — eyebrow, headline, subtext, link {label,href}
- `try_on_feature` — eyebrow, headline, subtext, image {url,alt}, button {label,href}
- `bestsellers` — eyebrow, headline, subtext, limit, link {label,href}
  (which products appear is the `products.is_bestseller` toggle)
- `brand_story` / `image_text` — eyebrow, headline, body, image {url,alt},
  image_side ("left" | "right"), button {label,href}
- `craft` — eyebrow, headline, subtext, items [{title,description}]
- `testimonials` / `press` — eyebrow, headline (rows come from their own tables)
- `newsletter` — eyebrow, headline, subtext, placeholder, button_label,
  success_message, consent_text
- `contact_details` — eyebrow, headline, subtext, email_label, phone_label, address_label
- `contact_form` — eyebrow, headline, subtext, name_label, email_label, subject_label,
  message_label, button_label, success_message, consent_text
- `rich_text` — eyebrow, headline, body_html

### Placeholder imagery

`public/placeholders/*.svg` are stand-ins referenced by URL from the database.
Uploading a real image in the admin panel replaces the URL with a storage URL —
no code change is needed. `try_on_models.photo_url` is deliberately null: the face
detector needs a real portrait, so sample-model mode stays off until real photos
are uploaded.
