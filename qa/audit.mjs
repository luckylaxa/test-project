/**
 * Automated QA sweep. Loads every public route at four widths and reports
 * anything a reviewer would raise: JS errors, failed requests, sideways
 * scroll, heading structure, missing alt text, unnamed controls, small tap
 * targets and duplicate ids.
 *
 * Run: node qa/audit.mjs [baseUrl]
 */
import pw from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:3100";
const WIDTHS = [375, 414, 768, 1280, 1600];
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const ROUTES = [
  "/", "/products", "/products?q=rouge", "/products?category=lips&sort=price-asc",
  "/collections", "/looks", "/journal", "/try-on", "/about", "/contact",
  "/account", "/shipping", "/returns", "/privacy", "/terms",
  "/collections/velours-rouge", "/collections/lumiere-nue", "/collections/maison-noir",
  "/products/rouge-velmora", "/products/velours-matte", "/products/eclat-gloss",
  "/products/baume-teinte", "/products/poudre-joue", "/products/ombre-couture",
  "/products/trait-precis", "/products/voile-de-teint",
  "/journal/skin-first-colour-second", "/journal/anatomy-of-a-parisian-red",
  "/checkout/complete", "/checkout/cancelled",
  "/no-such-page-404",
];

const findings = [];
const add = (route, width, kind, detail) =>
  findings.push({ route, width, kind, detail });

const AUDIT = () => {
  const out = {};
  const vis = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  out.overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;

  const heads = [...document.querySelectorAll("main h1,main h2,main h3,main h4,main h5,main h6")]
    .filter(vis).map((h) => ({ level: +h.tagName[1], text: (h.textContent || "").trim().slice(0, 60) }));
  out.h1s = heads.filter((h) => h.level === 1).map((h) => h.text);
  out.skips = [];
  let prev = 0;
  for (const h of heads) {
    if (prev && h.level > prev + 1) out.skips.push(`h${prev} -> h${h.level} at "${h.text}"`);
    prev = h.level;
  }

  out.noAlt = [...document.querySelectorAll("img")]
    .filter((i) => !i.hasAttribute("alt"))
    .map((i) => (i.getAttribute("src") || "").slice(0, 80));

  const name = (el) =>
    (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || "").trim() ||
    (el.querySelector("img[alt]")?.getAttribute("alt") || "").trim() ||
    (el.getAttribute("aria-labelledby")
      ? (document.getElementById(el.getAttribute("aria-labelledby"))?.textContent || "").trim()
      : "");

  out.unnamed = [...document.querySelectorAll("button,a[href],[role=button]")]
    .filter(vis).filter((el) => !name(el))
    .map((el) => el.tagName + "." + (el.className || "").toString().slice(0, 60));

  /*
   * Two shapes are correct and permanently excluded, so the list stays signal:
   *  - the skip link, which is `sr-only` until focused and so measures 1x1;
   *  - the try-on photo input, a hidden file input driven by a visible label,
   *    which is the accessible way to style one.
   */
  out.smallTargets = [...document.querySelectorAll("button,a[href],input,select,textarea,[role=button],[role=tab]")]
    .filter((el) => !el.matches(".sr-only, .sr-only *, input[type=file]"))
    .filter(vis)
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.height < 24 || r.width < 24)
    .map(({ el, r }) => `${el.tagName} "${name(el).slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);

  const ids = {};
  for (const el of document.querySelectorAll("[id]")) ids[el.id] = (ids[el.id] || 0) + 1;
  out.dupeIds = Object.entries(ids).filter(([, n]) => n > 1).map(([id, n]) => `${id} x${n}`);

  out.unlabelledFields = [...document.querySelectorAll("input,select,textarea")]
    .filter(vis)
    .filter((f) => f.type !== "hidden")
    .filter((f) => {
      if (f.getAttribute("aria-label") || f.getAttribute("aria-labelledby")) return false;
      if (f.id && document.querySelector(`label[for="${f.id}"]`)) return false;
      return !f.closest("label");
    })
    .map((f) => `${f.tagName}[${f.type || ""}] name=${f.name || "?"}`);

  out.emptyLinks = [...document.querySelectorAll("a")]
    .filter((a) => {
      const h = a.getAttribute("href");
      return h === "" || h === "#" || h === "undefined" || h === "null" || /\/(undefined|null)(\/|$)/.test(h || "");
    })
    .map((a) => `href="${a.getAttribute("href")}" "${(a.textContent || "").trim().slice(0, 30)}"`);

  out.actionCount = [...document.querySelectorAll("main a[href],main button")].filter(vis).length;
  return out;
};

const browser = await pw.chromium.launch({ executablePath: CHROME });

for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();

  for (const route of ROUTES) {
    const errors = [];
    const failed = [];
    page.removeAllListeners("pageerror");
    page.removeAllListeners("console");
    page.removeAllListeners("response");
    page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
    page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200)); });
    page.on("response", (r) => {
      if (r.status() >= 400 && r.url().startsWith(BASE) && !route.includes("404")) {
        failed.push(`${r.status()} ${r.url().replace(BASE, "")}`);
      }
    });

    let res;
    try {
      res = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
    } catch (e) {
      add(route, width, "LOAD", e.message.slice(0, 120));
      continue;
    }
    const status = res?.status() ?? 0;
    const expect404 = route.includes("404");
    if (expect404 ? status !== 404 : status >= 400) add(route, width, "STATUS", String(status));

    await page.waitForTimeout(700);
    const a = await page.evaluate(AUDIT);

    if (a.overflow > 1) add(route, width, "OVERFLOW", `${a.overflow}px sideways`);
    if (a.h1s.length !== 1) add(route, width, "H1", `${a.h1s.length}: ${JSON.stringify(a.h1s)}`);
    for (const s of a.skips) add(route, width, "HEADING-SKIP", s);
    for (const s of a.noAlt) add(route, width, "NO-ALT", s);
    for (const s of [...new Set(a.unnamed)]) add(route, width, "UNNAMED-CONTROL", s);
    for (const s of [...new Set(a.smallTargets)]) add(route, width, "TAP-TARGET", s);
    for (const s of a.dupeIds) add(route, width, "DUPLICATE-ID", s);
    for (const s of a.unlabelledFields) add(route, width, "UNLABELLED-FIELD", s);
    for (const s of a.emptyLinks) add(route, width, "BROKEN-HREF", s);
    if (a.actionCount === 0) add(route, width, "DEAD-END", "no visible link or button in <main>");
    for (const e of [...new Set(errors)]) add(route, width, "JS-ERROR", e);
    for (const f of [...new Set(failed)]) add(route, width, "REQUEST-FAILED", f);
  }
  await ctx.close();
  process.stderr.write(`  swept ${width}px\n`);
}
await browser.close();

// Collapse findings that repeat at every width.
const byKey = new Map();
for (const f of findings) {
  const k = `${f.route}|${f.kind}|${f.detail}`;
  if (!byKey.has(k)) byKey.set(k, { ...f, widths: [] });
  byKey.get(k).widths.push(f.width);
}
const rows = [...byKey.values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.route.localeCompare(b.route));

console.log(`\n${rows.length} distinct findings across ${ROUTES.length} routes x ${WIDTHS.length} widths\n`);
let kind = "";
for (const r of rows) {
  if (r.kind !== kind) { kind = r.kind; console.log(`\n## ${kind}`); }
  const w = r.widths.length === WIDTHS.length ? "all" : r.widths.join(",");
  console.log(`  [${w}] ${r.route}  ${r.detail}`);
}
