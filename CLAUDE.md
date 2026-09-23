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

`public/media/*.jpg` are the hero, collection, look and journal images. The
**look** covers were produced by rendering each look's own shades onto the
supplied model portraits with `MakeupRenderer` — a look's cover therefore shows
the look it links to. This file used to claim the same of the **collection**
covers; it was not true. Those three were stock uploads sitting in Supabase
storage, and two of them had a competitor's wordmark in shot — "LANCÔME" on
Velours Rouge and an "ILLUMINATION MASK" tube on Lumière Nue, both legible at
card size on the home page. They are now free-licence photographs in
`public/media/collection-*.jpg`, chosen under the no-brand-mark rule below.

`/media/og-default.jpg` (1200x630) is the Open Graph fallback in
`site_settings.seo_og_image_url`, which was empty — every shared link showed no
preview image at all.

`public/media/products/<slug>-1.jpg` and `-2.jpg` are the product gallery, two
per product: a packshot and an editorial close-up, all 1000x1250 (4:5), which is
the ratio `GalleryAndShades` renders. They are free-licence stock photographs
(Unsplash), chosen on one rule beyond the look: **no legible third-party brand
mark**. Rouge Velmora's first photographs failed that rule outright - the tubes
read "Colors Queen" and "PLUM Matte Lip's Color" - so a fictional maison was
showing another brand's product as its own. Anything replacing these is checked
at full size, not in a thumbnail: several otherwise perfect candidates turned out
to carry a wordmark only visible zoomed in.

`public/placeholders/*.svg` are now referenced by **nothing** - no row, no
component. They are kept only as a fallback an editor could point at by hand.
Uploading a real image in the admin panel replaces the URL with a storage URL;
no code change is needed.

Testimonials carry **no portraits**, deliberately. The quotes and names are
invented, as a fictional brand's must be; putting a real photographed person's
face beside an invented quote attributed to someone else misrepresents that
person, whatever the photo's licence says. Three rows used to show a placeholder
avatar and three showed nothing, so the row was visibly uneven as well. The
renderer already handled a missing image.

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

---

## Cart and checkout (Phase 8)

Added after the original brief, which specified display-only prices. Stripe
**Checkout Sessions**, not Payment Links — a Payment Link is one URL per price
and cannot check out a multi-item basket.

- **The browser is never trusted with money.** The basket stores product ids,
  shade ids and quantities only. `createCheckout()` re-reads every price, name
  and image from Supabase before building the Stripe session. A tampered
  localStorage basket simply gets the real prices — verified by injecting a
  forged `unitAmount` and confirming the displayed and charged totals were
  unaffected.
- `price_amount` is an integer in the currency's smallest unit. Floats round
  badly and text invites charging the wrong number. `price_display` is separate
  and remains free text — it is the wording shown on the page.
- An unavailable or unpriced item **fails the whole checkout** rather than being
  dropped silently, so nobody is charged for a basket they did not see.
- Card details never reach this site: Stripe's hosted page collects them, so we
  stay out of PCI scope. There is no orders table — Stripe is the record of
  truth. Adding one would need a privileged writer, and this project never uses
  the Supabase service role key.
- The basket is read through `useSyncExternalStore`, not copied into state in an
  effect: that avoids a hydration mismatch (the server has no basket) and keeps
  two open tabs in step.
- `site_settings.checkout_enabled` is the master switch. With it off, no
  Add-to-basket buttons render and the server refuses checkout even if someone
  has items saved in their browser.

**Requires `STRIPE_SECRET_KEY`** as a server-side environment variable in Vercel
(no `NEXT_PUBLIC_` prefix — it must never reach the browser). Without it,
checkout fails with a clear message instead of breaking.

---

## Cart, checkout and customer accounts (Phase 7 additions)

- **The browser never sends money.** A basket line is `{productId, shadeId,
  quantity}` and nothing else. `createCheckout` re-reads every price, name and
  image from the database, so a tampered `localStorage` simply gets the real
  prices. Verified by injecting `unitAmount: 1` — display and Stripe total both
  stayed at the real figure.
- **Cart state uses `useSyncExternalStore`**, not `useState` + an effect. The
  server snapshot is empty, so there is no hydration mismatch and no
  setState-in-effect.
- **Gate order in `createCheckout` matters.** Basket shape → shop open and items
  valid → signed in → delivery address → Stripe key → session. The Stripe key is
  checked last on purpose: it is our misconfiguration, not something the customer
  can act on, so it must not pre-empt the actionable "please sign in" answer.
  It was first, which made the sign-up gate unreachable locally.
- `CheckoutResult.needs` (`"sign-in" | "address"`) lets the basket route to
  `/account?reason=…` instead of showing a dead-end message.
- **Customers are not admins.** `customers` is keyed by `user_id` with
  select/insert/update policies all `user_id = (select auth.uid())`. Public
  sign-ups must stay ENABLED for the shop to work; admin access is gated by the
  separate `admins` table, so an open register cannot mint an admin.
- `saveCustomer` takes `user_id` from the session, never from the form.

## Phase 8 — handover

- `ADMIN-GUIDE.md` is the non-technical manual. Its wording matches the panel's
  actual field names ("Web address", "Feature as a bestseller", "Save & Publish");
  if a label changes in the admin, change it there too.
- **`ui_labels` now has an editor.** It is a jsonb column with defaults in
  `LABEL_FALLBACKS` (`src/lib/labels.ts`), and until Phase 8 nothing in `/admin`
  could edit it — those public strings were effectively hardcoded. Site settings
  now has a **Wording** section that renders every fallback key, grouped, with the
  default shown as the placeholder. Only non-empty values are stored, so clearing
  a field restores the default rather than blanking the button.
  `LABEL_GROUPS` appends any unlisted key under "Other", so a new fallback is
  editable without anyone remembering to register it.
- **Auth errors are mapped, not passed through.** `messageFor()` in
  `auth-form.tsx` turns the provider's error codes into editable labels. Passing
  `signUpError.message` straight to the customer leaked provider wording and was
  not editable.
- Known gaps, deliberately not built: no orders list in `/admin` (orders live in
  Stripe), no shipping/tax calculation, no policy pages.
- Supabase's built-in email sender is rate limited to a few messages an hour and
  is not for production — sign-up confirmations will fail under real traffic
  until a real email provider is connected. Confirmed by hitting
  `over_email_send_rate_limit` during testing.

## Google sign-in

- `/auth/callback` (`src/app/auth/callback/route.ts`) swaps the provider's
  one-time `code` for a session. It must run per request (`instant = false`),
  sanitises `next` to same-site paths only (an open redirect otherwise), and
  prefers `x-forwarded-host` so the customer lands on the domain their session
  cookie was set for.
- **`site_settings.google_login_enabled` gates the button** (migration
  `velmora_google_login_toggle`, default `false`). Supabase answers an
  unconfigured provider with a raw JSON error page that has no way back, so the
  button must not exist until the provider is actually on. Order: Google Cloud
  OAuth client → Supabase provider + redirect allow list → this toggle.
- A Google customer arrives with no `customers` row, so the checkout gate sends
  them to `/account?reason=address`. The name is prefilled from
  `user_metadata.full_name`/`name`; the email always comes from the session.
- `saveCustomer` no longer returns the database's own error text — it returns
  `form_error_save`, which is editable.

### Cache gotcha when changing settings outside the admin

`getSiteSettings()` is `use cache` + `cacheTag(tags.settings)` + `cacheLife("days")`.
Only a save through `withAdmin()` calls `updateTag`, so a row changed by raw SQL
keeps serving the old object — including, after a migration, one missing the new
column entirely (a `?? false` then silently wins). Change settings through
`/admin` rather than assuming the page is broken.

**"or rebuild" was wrong, and this file said it.** The `use cache` store lives in
`.next/cache`, which `next build` does *not* clear — so a build after a raw-SQL
settings change happily reuses the stale entry. Setting `logo_url` by SQL and
rebuilding twice still served `logoUrl: null`; `rm -rf .next && npm run build`
fixed it on the first try. Outside `/admin` it is **`rm -rf .next`, then build**.

## Demonstration checkout

`site_settings.demo_checkout` (migration `velmora_demo_checkout`, default
`false`) lets the purchase flow be shown without a payment provider.

- **It is the last step only.** The demo branch sits after every real gate in
  `createCheckout` — basket shape, shop open, items available and priced,
  signed in, delivery address. Only the Stripe call is replaced, by a redirect
  to `/checkout/complete?demo=1`. So a demo exercises the real flow.
- **A configured key always wins**: `if (!secret && settings.demo_checkout)`.
  Adding `STRIPE_SECRET_KEY` turns real payments on even if the toggle was left
  set; the reverse cannot happen by accident. Verified both ways in a browser.
- **The wording never lies.** `cart_demo_note` replaces `cart_note` in the
  basket, and `Completion` swaps the confirmation heading and body for
  `checkout_demo_*`. All editable.
- `(site)/layout.tsx` applies the same `&& !process.env.STRIPE_SECRET_KEY`
  rule, so the basket cannot promise a demonstration while real payments run.
  That layout is part of the static shell, so the env var is read at **build**
  time — fine on Vercel, where an env change needs a redeploy anyway, but it
  means a local `next build` without the key and `next start` with it will
  disagree. Build and run with the same environment.

### Email confirmation blocks sign-up

Supabase Auth has *Confirm email* on, so `signUp` returns no session and
`signInWithPassword` answers `email_not_confirmed`. Combined with the built-in
sender's rate limit, nobody can complete registration. For a demo, turn
*Confirm email* off; for production, connect a real SMTP provider. Google
sign-in sidesteps both.

## Payments: Razorpay (replaced Stripe)

Stripe is gone, along with its dependency. Razorpay needs no SDK — order
creation is a `fetch` to their REST API with Basic auth, and signature
verification is Node's built-in `crypto`.

- **The flow is a modal, not a redirect.** The server creates an order
  (`POST /v1/orders`) and returns its id plus the *key id*, which is public by
  design. The browser opens Razorpay's widget with it; on success the widget
  hands back `razorpay_order_id`, `razorpay_payment_id` and
  `razorpay_signature`.
- **The browser's word is worth nothing.** `verifyPayment()` recomputes
  `HMAC-SHA256(order_id|payment_id)` with the key secret — which only the
  server has — and compares with `timingSafeEqual`, after a length check,
  because a plain `===` on the hex leaks the expected value byte by byte.
  Nobody sees a confirmation until that passes.
- **The amount is fixed server side** before the customer sees a payment form,
  so the widget cannot be opened for a different total.
- `loadRazorpay()` injects `checkout.razorpay.com/v1/checkout.js` only when
  someone actually pays — browsing the site contacts no payment provider at
  all. Verified: the only off-origin host while browsing is Supabase.
- Closing the modal, or `payment.failed`, is not an error. The basket is left
  exactly as it was.
- Env: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`, both server-side, no
  `NEXT_PUBLIC_` prefix. Absent + `demo_checkout` on → demonstration mode.

### Currency

The shop is priced in **INR**. In EUR the widget offered cards only; in INR it
also offers Netbanking and wallets (UPI needs enabling on the account), which is
the real reason to stay in rupees with an Indian gateway.

`price_amount` is an integer in the currency's smallest unit, so **changing
`site_settings.currency` does not convert anything** — flipping EUR to INR would
have turned a EUR 64 lipstick into INR 64. The seeded catalogue was re-priced
alongside the switch, at roughly INR 95-97 to the euro, rounded, keeping the
original ladder. Any future currency change needs the same treatment.

`formatMoney` picks its locale from the currency (`LOCALE_FOR`), because rupees
group in lakhs: 1,50,000, not 150,000.

### Verified end to end (test mode)

A real card payment was completed against the live Razorpay test account:
`pay_...` reached `status=captured`, INR 6,200, with `notes` carrying the
user id, the line items and the delivery address. The browser landed on
`/checkout/complete` — the real confirmation, not the demo one — which only
happens after `verifyPayment` passes, so the signature path is proven in
practice and not just in isolation.

**Test cards.** This account does **not** accept international cards:
`4111 1111 1111 1111` fails with "International cards are not supported", and
the basket is correctly left intact for a retry. Use a domestic card —
`5267 3181 8797 5449`, any future expiry, any CVV — and the 3DS step takes OTP
`1234`.

**Payment methods.** Cards, Netbanking and Wallets are offered in INR. UPI is
not, until it is enabled on the Razorpay account.

### Known gap: no webhook

`verifyPayment` is called from the browser once Razorpay's widget returns. If
the customer closes the tab between the money being captured and that call,
the payment exists at Razorpay and the site never knows: no confirmation, and
the basket still full. Razorpay's `payment.captured` webhook is the fix, and is
what makes this safe to leave running unattended.

## Orders (read back from Razorpay)

Closes the webhook gap's *consequence* without a webhook, a table or a
privileged writer. `src/lib/orders.ts` lists payments from Razorpay's REST API
and maps them; every payment already carries `notes.user_id`, the line items and
the delivery address, because `createCheckout` puts them there.

- **`/account` shows a customer their own orders.** `listOrders({ userId })`
  filters server-side, so one customer's orders can never reach another —
  verified with a second account, which sees "No orders yet" while the first
  sees its paid order.
- **`/admin/orders`** lists everything, including failed and abandoned
  attempts (`includeUnpaid`), because a payment method rejecting everyone shows
  up there first. Gated by `requireAdmin()` like every other admin page, with
  CSV export.
- **`null` means "could not read", `[]` means "none".** The screens word those
  differently: a customer must never be told they have no orders because a key
  was missing.
- Razorpay cannot filter by notes, so a listing scans the most recent `WINDOW`
  (100) payments. Past that, older orders stop appearing — at real volume this
  needs an orders table, which needs a writer this project deliberately does
  not have.
- This does not replace a `payment.captured` webhook for *fulfilment alerts*;
  it removes the need for one to see what was paid.

## Accessibility and speed corrections

Two earlier claims in this file were wrong, and are corrected here.

### Contrast was never measured

Phase 6 audited structure — headings, alt text, labels, focus — and this file
then claimed "real contrast even with a soft palette". Colour was never
measured. When it was, three things failed:

| Token | Was | On canvas-soft | Now | Now |
|---|---|---|---|---|
| `--ink-muted` | `#8a827a` | 3.33:1 FAIL | `#736c65` | 4.55:1 PASS |
| accent as text | `#c2a36b` | 2.11:1 FAIL | `--accent-text` | 4.87:1 PASS |
| control borders | `rgba(11,11,11,.12)` | 1.30:1 FAIL | `--line-strong` | 3.03:1 PASS |

- `--ink-muted` is now **the lightest text the palette allows**. Anything
  lighter fails AA on `--canvas-soft`. Do not lighten it back.
- **The accent cannot be trusted as text**: editors choose it, and champagne on
  ivory is 2.28:1. `--accent-text` is `color-mix(in srgb, var(--accent) 60%,
  var(--ink) 40%)`, which clears AA whatever colour is picked. Use `--accent`
  for fills, rules and swatches; `--accent-text` for words.
- `--line` stays a hairline for decorative dividers. Anything a person must
  find and type into uses `--line-strong`, which meets the 3:1 WCAG asks of a
  control boundary. The sign-in fields were previously near-invisible.

### The site was not slow, the animation was

Measured click-to-readable on a nav link:

| | Before | After |
|---|---|---|
| navigation committed | 103ms | 103ms |
| page wrapper opaque | 505ms | 204ms |
| first section visible | 906ms | 404ms |

Next commits the navigation in ~100ms either way. The rest was
`.page-enter` (0.55s) stacked on `.reveal` (1.1s), both starting from
`opacity: 0` — roughly 800ms of invented latency on every click. Now 0.18s and
0.45s. **Anything long here is felt as the site being slow**, not as calm.

## Sign-in returns you where you were

`createCheckout` refusing with `needs` sends the customer to
`/account?reason=…&next=<path they were on>`. `next` is honoured after sign-in,
after Google, and after the address is saved — always sanitised to same-site
paths, since it arrives from the address bar. Previously every route ended on
`/account`, leaving someone mid-purchase to find their basket again.

## Google sign-in is detected, not configured

`isGoogleEnabled()` (`src/lib/auth-providers.ts`) asks the auth server whether
the provider is on — a redirect means yes, 400 `provider is not enabled` means
no — cached for minutes. The `site_settings.google_login_enabled` toggle is
gone from the admin panel (the column is dormant): a setting that has to be
kept in step with the Supabase dashboard drifts, and when it drifts the button
either vanishes for no visible reason or dead-ends. **The button now appears by
itself the moment Google is configured in Supabase**, and never before.

## Confirmation emails

`/auth/confirm` redeems `token_hash` + `type` through `verifyOtp`, so an
expired or reused link lands on a page that says so instead of a dead tab.

A confirmation link reading "site can't be reached" is **not** this route: it
means Supabase's **Site URL** still points at `localhost:3000`. Set it to the
deployed URL under Authentication → URL Configuration, and add that URL to the
redirect allow list. To use this route, point the email template at
`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .EmailActionType }}`.

The simpler answer for a shop is to turn *Confirm email* off entirely: sign-up
then returns a session immediately and the customer is in, which is how Amazon
and Flipkart behave. Nothing in the code needs changing for that.

### Tap targets

Measured at 375 and 768px after the contrast work, because this file's own
rules say mobile first and the fix had only been checked at 1280. Several
controls were far below the 24px WCAG 2.2 asks, the basket button among them:

| Control | Was | Now |
|---|---|---|
| Basket, account, nav, brand mark | 19–28px | 44px |
| "View all collections" and siblings | 27px | 44px |
| Footer nav, contact, legal, social | 20px | 32px |
| Sign in / register switch | 19px | 44px |

`.tap` (44px) and `.tap-sm` (32px) in globals.css are `inline-flex` with a
`min-height` and no horizontal padding, so a control grows into the whitespace
the design already has without shifting anything sideways. These are small
uppercase labels: the hit area has to come from padding, not font size.

Now clean at both widths, no horizontal overflow. The skip link measures 1px
because it is `sr-only` until focused, which is correct; the mobile menu's
links measure 0 because the closed menu is `display: none`.

## Policy pages

Shipping, Returns & Refunds, Privacy and Terms exist as ordinary `pages` rows
with a `rich_text` section, so the brand team edits them in `/admin` like any
other page — no code holds policy text. All four are in `legal_links`.

Razorpay requires shipping, refund, terms and privacy policies published on the
site before it will activate an account, so this gates real payments.

- **The wording is a draft, not legal advice.** Business specifics are
  `[SQUARE BRACKETS]`: entity name, GSTIN, registered address, delivery windows
  and charges, return window, jurisdiction. It has not been reviewed by a lawyer.
- **The seeded privacy and terms text was replaced because it had become false.**
  Terms said "prices are indicative and for display only. This site does not
  process orders"; privacy said a newsletter email was all that was collected.
  Both predate the shop. Leaving them would have been a live misstatement on a
  site that now takes money and stores delivery addresses.
- The try-on paragraph is kept: it is the one claim here that is both
  distinctive and verifiably true.

### The basket no longer claims tax it does not charge

`cart_note` said "Taxes and delivery are calculated at checkout". Nothing
computes either — the charge is exactly `price_amount`. It now says the price
shown is the price paid. **Whether prices include GST is still an open business
decision**, and adding tax or delivery would be a real build, not a wording fix.

## Every page has exactly one h1

Only `hero` emitted an `h1`, so a page built from text sections alone had none —
which was true of all four policy pages, and would be true of any page an editor
builds without a hero.

`SectionHeading` now takes a `headingLevel` (the same pattern `ProductCard`,
`CollectionCard` and `Accordion` already use), forwarded by every section that
can open a page. `RenderSections` gives the first such section `headingLevel={1}`
when the page has no hero. Audited across thirteen routes: one `h1` each, and it
is the first heading on the page.

## Order tracking and saved items

Two tables (migration `velmora_order_status_and_wishlist`), both RLS own-rows.

**`order_status`** is keyed by the Razorpay `payment_id`, so it annotates a
payment rather than duplicating it — there is still no second order ledger.
Razorpay knows a payment was captured and refunded; it knows nothing about
packing, couriers or delivery, and that is the only thing a customer means by
"track my order".

- Customer reads their own rows; only `is_admin()` writes. No service role key.
- `saveOrderStatus` takes `user_id` from the payment's own notes, read server
  side — the form supplies the payment id, never the owner, so an admin cannot
  accidentally attach a stranger's order to someone else.
- An order with no row shows as **placed**: paying for something places it.
- Refunds come from Razorpay (`amount_refunded`), not from this table, and
  replace the progress track rather than sitting alongside it.
- Verified with two accounts: the owner sees courier and tracking number, the
  second account sees neither.

**`wishlist`** is `(user_id, product_id)`. A product hidden or deleted since it
was saved drops out of the list rather than rendering a broken card.

`SaveSlot` wraps the session read in `Suspense` so the product page **stays
static** — whether *you* saved something is per-visitor, and making the whole
page render per request for one heart would have cost the cache.

## Type was too light to read

Body was `font-weight: 300` at `0.9375rem`. Jost is a geometric sans with thin
strokes; at 300 on ivory it read as faint grey rather than as text, which is
what "not readable" meant — the colour fix alone did not solve it.

| | Was | Now |
|---|---|---|
| Body | 300 / 15px | **400 / 16px** |
| Headings (Cormorant) | 300 | **400** |
| `.eyebrow` and 11px UI labels | 400 / 11px | **500 / 12px** |

16px is the browser default and the accessibility baseline. Cormorant is a
high-contrast serif whose thin strokes vanish at 300 once a heading is smaller
than a hero. Weights 300–500 were already loaded, so none of this added a
download.

## The logo

`public/brand/` holds the brand mark, set in `site_settings` like any other
content — `logo_url`, `logo_light_url`, `favicon_url` — so the brand team can
replace it from `/admin` without a deploy.

| File | Use |
|---|---|
| `velmora-logo.png` | Dark mark, the default. Header and footer. |
| `velmora-logo-light.png` | Pale mark, for the transparent header over a hero. |
| `velmora-mark.png` | The emblem alone, square on ivory, as the browser icon. |

- **Both colourways are generated from the dark file's alpha channel**, not taken
  from the two supplied files. The supplied pair trimmed to different
  proportions (3.14 vs 2.87), and two marks of different sizes swapping on
  scroll would visibly jump. Recolouring one mask guarantees they register to
  the pixel. The artwork is clean monochrome-on-transparent, so nothing is lost.
- **The swap is CSS, not JS** (migration `velmora_logo_light`). The light mark is
  stacked on the dark one, absolutely positioned so it adds nothing to the
  layout, and the existing `body:has([data-hero-media]) [data-site-header]
  [data-solid="false"]` selector cross-fades between them on the same 700ms
  curve as the header's own colour change. No flash on first paint, no second
  render on scroll.
- **Cascade layers, not specificity, decide this.** The light mark's default
  `opacity: 0` first went on the element as Tailwind's `opacity-0`. Tailwind
  utilities are a *later layer* than `components`, where these overrides live, so
  the utility won however specific the override was and **both marks were
  invisible over a hero** — the swap looked like it worked in the code and showed
  nothing on the page. The default now sits in the same layer as its overrides.
- The light mark renders `aria-hidden` with `alt=""`: it is the same brand mark
  as the dark one, and only one of the two may carry the accessible name. It
  therefore has no alt column — `logo_light_alt` was added and dropped again
  (`velmora_logo_light_drop_unused_alt`) rather than shipped unused.
- `width`/`height` on the `<Image>` are the true 1000x319 ratio. The old text
  fallback's 148x32 claimed 4.6:1 and reserved the wrong box.
- **The favicon had no field in `/admin`** — `favicon_url` was in the form's type
  and in its save payload, but no input ever rendered, so it was unreachable in
  the same way `ui_labels` was before Phase 8. It has one now, beside the two
  logo fields.

### Product cards wrap rather than overflow

Found while checking the logo at 375px: the home page scrolled sideways by 4px.
Not the logo — a `ProductCard`. Its bottom row is `justify-between` with five
14px swatches on the left and the price on the right, which do not fit in a
~160px card in a two-column grid, and `justify-between` has nothing to give.
The row now wraps, so the price drops to its own line on a narrow card and stays
inline everywhere else.

A first attempt cancelled the price's trailing letter-space with `-mr-[0.14em]`,
on the theory that `tracking` pads after the last character. It does, but that is
1.5px of a 4px overflow — the measurement said so, and the fix was wrong.

Verified: ten routes at 375, 768, 1280 and 1600 — no horizontal overflow
anywhere. The brand link still measures 44px at every width.

## A try-on that can be bought from

The studio used to end at "View product". Someone who had just found their
shade was sent to a page where they had to find it again — the one moment the
whole feature exists to create, spent on navigation.

`WearingNow` (`try-on/product-panel.tsx`) replaces `AppliedChips`. Every applied
shade is now **one row** carrying its own price, Add to basket and save, and two
or more buyable shades get an **Add all to basket**, so a whole look goes in with
one tap. Verified end to end: two shades from two categories both landed in
`localStorage` with the right product and shade ids, and the drawer opened.

It also merges two lists. `AppliedChips` rendered each applied shade twice —
once as a chip, once as a slider row — naming every shade in both.

**The mobile sheet was capped at 78svh, which left only the forehead visible.**
That is the wrong half of the face when the thing being tried on is a lipstick.
62svh keeps the mouth above the sheet and the panel still scrolls.

The product list inside the sheet has a mask-image fade at its foot. Without it
the list stops mid-glyph against the shelf below and reads as a rendering fault
rather than as "there is more below".

## Save and add to basket from any card

`ProductCard` was a link and nothing else. It now carries a `SaveHeart` over the
image and a `QuickAdd` beneath, wherever cards appear.

- **Saved state is one read for the whole page.** `SavedProvider` fetches the
  viewer's saved ids once from the browser after hydration. A Suspense read per
  card would have cost every grid its prerender, for a heart.
- **`QuickAdd` never guesses a shade.** More than one shade opens a chooser in
  place; picking the first one for someone is how you get a returned lipstick.
- **The controls sit outside the card's `<Link>`.** A `<button>` inside an `<a>`
  is invalid, and the click would follow the card instead of saving.
- **The chooser floats, it does not grow the card.** Grown, it stretched its
  whole grid row and opened a ~240px gap between price and button in the card
  beside it. Card heights measured identical, open and closed.
- `ShopProvider` carries the five strings and the `checkout_enabled` flag the
  card controls need. Cards are rendered from three different server components;
  threading them through each call site means every future caller has to
  remember them.

## The mobile menu was see-through

Reported from a phone: the menu's links floated over the footer, which showed
through behind them.

**`backdrop-filter` makes an element a containing block for its `position:
fixed` descendants.** The header gains `backdrop-blur` the moment the menu
opens, and the menu was a child of it, so `fixed inset-0` resolved against the
77px header rather than the viewport — **measured 160px tall on an 812px
screen**. Its background stopped under the bar while its content ran on down the
page.

The menu is now a **sibling of `<header>`**, so no filter, transform or
`will-change` added to the header later can silently trap it again. Measured 812
of 812 after.

The same screenshot showed a second gap: **Your account is `hidden
sm:inline-flex`**, so on a 375px phone orders and saved items had no route at
all short of typing the URL. The menu carries them now.

Verified after all of it: twelve routes at 375, 414, 768, 1280 and 1600 — no
horizontal overflow, no JS errors — and every new card control measures 44px.

## The phone try-on is an overlay, not a panel

Reported from a real iPhone: the camera sat in a letterboxed strip with a
screenful of dead ivory beneath it, and "Products & shades" was pinned to
`bottom: 0` — which on iOS Safari is *behind* the browser's own toolbar. The
only way into the shades and the basket was invisible.

Two separate faults:

- The studio had no height on mobile at all. It was a tall scrolling page whose
  stage was `min-h-[58svh]`. It is now `h-[calc(100dvh-5rem)]`, a flex column —
  `dvh`, not `svh`, because that is the unit that accounts for Safari's toolbar.
- The controls now **float over the stage** (`MobileControls`), not in a panel
  below or over it. Every panel we tried covered the mouth, which is the part a
  lipstick goes on. The attempts are worth recording because each looked right
  before it was measured:
  - a 78svh sheet left only the forehead;
  - 62svh still cut the lips off;
  - a `34dvh` cap on the stage was arithmetic, and wrong — the sheet's real top
    was 46px higher;
  - putting the sheet in the flex column squeezed the face to 127px **and** made
    the panel's inner scrollers overlap, because they need a definite parent
    height.
  Over the stage there is nothing to guess: the face keeps the whole screen and
  the controls take a strip of it.

The stage is `bg-ink lg:bg-canvas-soft`. The letterbox bars were ivory, so the
pale chips floating over them could not be read.

## Dead ends, found by counting

Every route was loaded and its main content checked for a single visible link
or button. Three had none at all:

| Route | Was | Now |
|---|---|---|
| `/journal/<slug>` | 0 actions — the article simply stopped | back to the journal, previous and next |
| `/shipping` | 0 actions | the other policies, from `legal_links` |
| `/privacy` | 0 actions | same |

An **empty basket was the worst of them**: the drawer hides its whole footer
when there is nothing in it, so the only control on the panel was Close. It now
offers the collections, the try-on and saved items.

## The account page is tabbed

Details, saved items and orders were one column. With a hundred saved items you
had to scroll past every one to reach your orders — the thing people open an
account page for. `AccountTabs` splits them, `?tab=` deep-links a section, and
every panel stays mounted so switching refetches nothing.
