# Velmora Beauté — running the site

This is the whole site in plain language. You do not need a developer for anything
in here, and you cannot break the site by editing content: if you empty a field,
that piece simply disappears from the page rather than leaving a hole.

Nothing you change needs a redeploy. Save, and the live site updates within seconds.

---

## 1. Signing in

1. Go to **your-site.com/admin**.
2. Enter your email and password.
3. You land on the dashboard.

Accounts are created for you in the Supabase dashboard — there is no "register"
link on `/admin`, on purpose. If you need another person to have access, ask
whoever manages the Supabase project to add them.

> Customers signing up to buy something is a different thing entirely. A customer
> account gives them nothing but their own delivery address. It can never become
> an admin account.

**Forgot your password?** It is reset from the Supabase dashboard, not here.

---

## 2. How the site is put together

Three ideas, and the rest follows:

- **Pages** are made of **sections**, stacked top to bottom. A section is a band
  across the page — a hero, a row of products, a block of text next to an image.
- **The catalogue** — collections, products, shades — lives on its own. Sections
  point at it. Change a product once and it updates everywhere it appears.
- **Site settings** are the things that repeat on every page: the logo, the menu,
  the footer, contact details, and the short reusable pieces of text.

So: to change words on the home page, edit that page's sections. To change a
price, edit the product. To change the menu, edit site settings.

---

## 3. Editing a page

**Pages & sections → pick a page.**

Each section is a card. You can:

- **Open** it and edit its fields.
- **Reorder** it by dragging, or with the up and down arrows on the card —
  the arrows are easier on a touchscreen.
- **Hide** it with the visibility toggle — it stays in the list but disappears
  from the site. Better than deleting when you are unsure.
- **Delete** it when you are sure.
- **Add** a new one with the button at the bottom, then choose its type.

Every field is optional unless it is marked required. If a section has a subtitle
and you clear it, the section renders without a subtitle rather than showing a gap.

When you are done, press **Save & Publish**. Use **View live site** next to it to
see your own change straight away.

### The section types

| Type | What it is |
|---|---|
| Hero | The big opening band — image or video, headline, up to two buttons |
| Collections | A grid of your collections |
| Looks | A grid of curated looks |
| Bestsellers | A row of products. *Which* products is the "Bestseller" toggle on each product, not a list here |
| Try-on feature | A band promoting the virtual try-on |
| Brand story / Image + text | A block of writing beside an image; you choose which side the image sits on |
| Craft | A headline plus a list of short title-and-description items |
| Testimonials | Pulls from the Testimonials list |
| Press | Pulls from the Press logos list |
| Newsletter | The sign-up band, including its success message and consent line |
| Contact details | Email, phone and address, taken from site settings |
| Contact form | The enquiry form, including its field labels and success message |
| Rich text | A plain block of formatted writing |

### Buttons

A button is two fields: the **label** (what it says) and the **link** (where it
goes). Leave both empty and the button does not appear. For a link inside the
site, write the path — `/collections`, `/try-on`. For somewhere else, paste the
full address starting with `https://`.

---

## 4. Products and shades

**Products & shades.**

A product has:

- **Product name** and **Web address**. The web address is the end of the link —
  `velours-matte` becomes `/products/velours-matte`. Changing it breaks any
  existing link to that product, so change it only before launch or if you truly
  mean to.
- **Displayed price**. This is what the customer is charged, so it is worth a
  second look.
- **Short description** for grids, and **Description**, **Ingredients** and
  **How to apply** for the product page — each hidden if you leave it empty.
- **Category** and **Collection** — how it is grouped and filtered.
- The gallery images. The first is the one used in grids and in the basket.
- **Feature as a bestseller** — the toggle that puts it in a Bestsellers section.
- **Show on the website** — off means the product vanishes from the site entirely.
- **Available to buy** — on means it can be bought. A product that is shown but
  not available to buy gets a product page with no "Add to basket".
- **Page title** — its own search-engine title, overriding the site default.

### Shades

Shades sit inside a product. Each one has a name, a colour, a finish, and a
visibility toggle. The colour is what the virtual try-on actually paints on a
face, so pick it carefully — there is a live preview on a real model photo right
in the shade editor. Judge the colour there, not from the swatch.

Reorder shades by dragging. That order is the order customers see.

---

## 5. Collections, looks and models

**Collections** group products and get their own page. Name, slug, description,
a cover image, and a visibility toggle.

**Curated looks** are a set of shades applied together — the thing a visitor can
try on in one click. Build a look by choosing the shades that make it up, then
give it a name, a photo and a description. As with shades, there is a preview on
a real face.

**Try-on models** are the sample portraits a visitor can use instead of their own
camera. Upload real portraits, front-facing and well lit — the face detector needs
to find a face. Until you upload at least one, the "try a model" option simply
does not appear, which is fine.

---

## 6. Journal, testimonials and press

**Journal** is the articles. Title, slug, cover image, body, publish date and a
visibility toggle.

**Testimonials** are quote, name, and an optional role or city.

**Press logos** are an image plus the publication's name, with a link if you have
one.

Each of these three feeds the matching section type. Add rows here; show them by
putting the section on a page.

---

## 7. Site settings

**Site settings** holds everything that repeats.

- **The brand** — name, logo, favicon (the small icon in the browser tab), and the
  accent colour. The accent is the one colour you control; the rest of the palette
  is fixed so the site stays coherent.
- **Contact** — email, telephone, address. These feed the footer and the contact
  sections.
- **Navigation and footer** — the top menu, the footer columns, the social links,
  the legal links. Each is a list of label-and-link pairs you can reorder.
- **Search and sharing** — the default page title, the default description, and the
  image used when someone shares a link. A page with its own SEO fields overrides
  these; a page without them falls back here.
- **The shop** — currency, and **Open the shop**. Turn that off and the basket and
  checkout stop accepting orders while the rest of the site carries on as a
  catalogue.
- **Virtual try-on** — the wording on the camera screen and the colour disclaimer.
- **Wording** — every short reusable string on the site: button text, empty-state
  messages, form field labels, checkout and account messages. Each field shows the
  built-in wording in grey. Type over it to change it; clear it to go back to the
  default.

---

## 8. The virtual try-on

There is nothing to configure beyond shades, looks and model photos. Worth knowing:

- Everything happens inside the visitor's own browser. No photo and no camera
  frame is ever uploaded, logged or stored — not by us, not by anyone. You can say
  so to customers without qualification.
- The camera stops the moment someone leaves the studio.
- The colour a visitor sees depends on their screen, which is why the disclaimer
  in site settings exists. Keep it.

---

## 9. Orders, customers and payment

A customer must create an account and save a delivery address before they can pay.
That is deliberate — an order you cannot deliver is not an order.

The order of events:

1. They add items to the basket.
2. They press checkout. If they are not signed in, they are taken to sign up.
3. Once signed in, if they have no delivery address, they are asked for one.
4. Then they go to **Stripe** to pay.

They can register with an email and password, or with Google if you have turned
**Let customers sign in with Google** on in site settings. See section 10 for the
one-time setup that toggle depends on.

Card details never touch this site. Stripe collects them, which keeps you out of
the rules that apply to handling card numbers yourself.

**Where to see orders:** in your Stripe dashboard, not here. This admin panel does
not currently list orders.

### Demonstration mode

Site settings → Selling → **Demonstration mode** lets people walk the whole
purchase without any money moving. They still sign in, still save a delivery
address, still press checkout — but no card is asked for and no order is placed.
The basket says so before they start, and the confirmation page says so again
afterwards.

Use it to show the shop to people before payments are set up.

It switches itself off the moment real payments are configured: if a Stripe key
is present, checkout goes to Stripe and the demonstration notice disappears,
whatever this toggle says. You cannot accidentally leave a live shop pretending
to be a demo.

**For anyone other than you to sign up during a demo**, turn *Confirm email* off
in Supabase → Authentication → Sign In / Providers → Email. Otherwise every new
customer is told to check an inbox for a message that the built-in sender is too
rate limited to deliver.

**Newsletter** and **Enquiries** in the sidebar are the two things visitors submit
that do land here. Both can be read here and downloaded as a spreadsheet file (CSV).

---

## 10. Before you open the shop

A short list of things that are not content, and that someone will need to do once:

- **Stripe key.** The site needs `STRIPE_SECRET_KEY` set on the server. Until then
  checkout tells customers it is not configured.
- **Email delivery.** Supabase's built-in email sender is rate limited to a handful
  of messages an hour and is not meant for real customers. Connect a proper email
  service in Supabase, or sign-up confirmations will start failing the moment more
  than a couple of people register at once. Google sign-in sidesteps this, because
  Google has already confirmed the address — but people who prefer email and
  password still need it working.
- **Google sign-in**, if you want it. Three steps, in order:
  1. In the Google Cloud console, create an OAuth client (type: web application)
     and add `https://pezhyriabwmintczrkdd.supabase.co/auth/v1/callback` as an
     authorised redirect URI. Copy the client ID and secret.
  2. In Supabase → Authentication → Providers → Google, switch it on and paste
     those two values. Then, under URL Configuration, add your live site address
     to the redirect allow list.
  3. Only then turn **Let customers sign in with Google** on in site settings.
     Doing this before step 2 sends customers to a Google error page with no way
     back, which is exactly why the toggle exists.
- **Policy pages.** There are no shipping, returns, refund or privacy pages yet,
  and no tax or delivery charges are calculated. Most places require some of this
  before you can sell. Worth a conversation with someone who knows your
  jurisdiction.
- **Favicon.** Upload one in site settings, or browsers show a blank tab icon.
- **Leaked-password protection.** Worth switching on in Supabase's auth settings.

---

## 11. If something looks wrong

**A change did not appear.** Check you pressed Save & Publish, and that the item's
visibility toggle is on. Then reload.

**A section vanished.** Most likely a required field was cleared. Open it and look
for an empty field.

**A product is missing from a grid.** Check: is it visible? Is it in the right
collection? For a Bestsellers row, is the Bestseller toggle on?

**The try-on cannot find a face.** The photo needs a clear, front-facing, well-lit
face. Sunglasses, heavy shadow and steep angles defeat it.

**Someone cannot sign up.** Almost always the email rate limit in section 10.

**The site is down, or shows an error page.** That is not a content problem.
Contact whoever maintains the code.
