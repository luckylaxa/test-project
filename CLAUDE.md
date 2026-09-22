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

### Imagery

`public/media/*.jpg` are the hero, collection, look and journal images. The look
and collection covers were produced by rendering each look's own shades onto the
supplied model portraits with `MakeupRenderer` — a look's cover therefore shows
the look it links to.

`public/placeholders/*.svg` remain for **product photography only**, which nobody
has yet. Uploading a real image in the admin panel replaces the URL with a
storage URL; no code change is needed.

---

## Virtual try-on (Phase 4)

`src/lib/try-on/` holds the engine, `src/components/try-on/` the UI.

- **Self-hosted model.** `public/mediapipe/face_landmarker.task` is committed and the
  WASM runtime is copied from node_modules by `scripts/setup-mediapipe.mjs` on
  predev/prebuild. Opening the studio makes **no third-party request** — verified in a
  headless browser. Do not switch this back to a CDN.
- **Lazy.** `@mediapipe/tasks-vision` is imported inside `loadFaceLandmarker()`, so the
  bundle and the 3.6MB model load only when a source is chosen, never on other pages.
- **Blend modes, not paint.** Colour is composited with `color` (hue and saturation from
  the shade, luminosity from the skin) plus `multiply` for depth. A `source-over` fill
  would bury pores and lip texture and read instantly as a sticker. The multiply weight
  is curved by shade lightness, or deep shades render as pastel versions of themselves.
- **Every mask is blurred and scaled to face width**, so the result looks the same near
  or far. Landmark outlines are Catmull-Rom splines — straight segments look faceted.
- **Eyeliner is a tapered band**, thin at the inner corner, thicker outward, tapering to
  nothing at both ends. A uniform stroke looks like a marker line.
- **One Euro filter** smooths landmarks: heavy smoothing while still, almost none while
  moving, so colour stays locked without lag.
- **Privacy is structural.** Frames live in a `<video>` that is never displayed, are drawn
  to a canvas, and are never uploaded. `releaseSource()` stops every track before any
  source swap and on unmount; the loop idles while `document.hidden`.

Tuning values live in `makeup-renderer.ts` and were set by rendering real seeded shades
against the sample portraits and looking at the output. Change them the same way.

---

## Admin panel (Phase 5)

`/admin` is the content manager. `src/app/admin/(protected)/` holds the gated
screens; `/admin/login` sits outside that group so it is not gated by its own
layout.

- **Authorization is checked in every page**, not only the layout. Layouts and
  pages render in parallel, so a page's queries run before a layout's redirect
  lands — RLS blocks anything private, but the page should not run at all.
  Every admin page starts with `await requireAdmin()`.
- **Admin routes set `export const instant = false`.** They read the auth cookie,
  so they render per request. Their build-time shells are empty (verified).
- **Every write goes through `withAdmin()`**, which re-checks the admin and then
  calls `updateTag` for the affected cache tags. `updateTag` (not
  `revalidateTag`) is deliberate: it expires immediately, so an editor who saves
  and clicks "View live site" sees their own change rather than the last version.
- **List screens replace the whole set** (`saveRows`, `saveShades`, `savePage`,
  `saveLooks`) rather than tracking individual adds and removes. Sort order is
  rewritten from list order, so what the editor sees is what the site shows.
- **Alt text is required** on uploads. **Shade and look previews** render on a real
  try-on model photo using the same `MakeupRenderer` the public studio uses, so a
  colour can be judged before publishing. Face detection is cached per photo.
- Uploads go to the `site-media` bucket under a random filename, so two editors
  uploading `hero.jpg` cannot overwrite each other.
- The admin's own labels and help text are the one place literal strings are
  allowed — they are panel chrome, not site content.

---

## Live updates and polish (Phase 6)

- **On-demand revalidation** is wired through `withAdmin()` and the per-table save
  actions, which call `updateTag` for the tags a change touches. Content edits
  never need a redeploy.
- **Error boundaries**: `(site)/error.tsx`, `admin/(protected)/error.tsx` and a
  root `global-error.tsx`. Their wording is the one public copy that cannot come
  from the database — they render when reading the database is what failed.
- **`not-found.tsx` copy IS editable** (`ui_labels.not_found_*`), wrapped in a
  try/catch so a failed settings read still renders something.
- **Page transitions**: a 0.55s opacity cross-fade keyed on the pathname,
  disabled under `prefers-reduced-motion` by the rule in globals.css.
- **Heading levels are explicit.** `ProductCard`, `CollectionCard` and `Accordion`
  take a `headingLevel`: 3 under a section's h2, 2 when listed directly under a
  page's h1. Getting this wrong skips a level and breaks screen-reader
  navigation — it did, on the collection and product pages.
- `/try-on` has a `pages` row, so its title and SEO are editable and it carries a
  screen-reader-only h1. The studio has no room for a visible one.

Measured: ~225kB JS per page, and `/try-on` is no heavier than any other page —
the MediaPipe model and WASM load only once a source is chosen.
Audited across six pages: one h1 each, no skipped levels, no missing alt, no
unlabelled controls, visible focus on every tab stop.

---

## Quality sweep (Phase 7)

- **Hardcoded content**: the last visitor-facing strings moved into
  `site_settings.ui_labels` — the skip link, the menu's open/close labels, the
  nav landmark name, the try-on canvas label and both form error messages.
  Screen-reader labels count: they are read aloud.
- **Rich text is sanitized** (`src/lib/sanitize.ts`) with an allowlist matching
  what the admin editor can produce. Only admins can write it and an admin
  already controls the site, so this is defence in depth against a compromised
  account, not a privilege boundary. Verified against script tags, event
  handlers, `javascript:` and `data:` URLs, iframes, inline styles and forms.
- **JSON-LD is escaped** with `jsonLdScript()`. A product name containing
  `</script>` would otherwise close the tag and the rest would parse as HTML.
- **A transparent header over a hero needs light type.** `body:has([data-hero-media])`
  flips it, reverting on scroll. The pale placeholder hid this; a real
  photograph made the brand name almost invisible.

Verified: camera denial falls back correctly and still offers upload and sample
models; an uploaded photo produces **zero off-origin requests**; the snapshot
downloads; RLS blocks a signed-in non-admin from every table.
