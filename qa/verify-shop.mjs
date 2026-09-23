/** Checks the shop behaviours a reviewer would click through by hand. */
import pw from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:3100";
const browser = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("  PAGE ERROR:", e.message.slice(0, 120)));

/**
 * The buy button, told apart from the shade swatches.
 *
 * "Sold out" is the accessible name of BOTH a sold-out swatch and the disabled
 * buy button, and the swatch comes first in the DOM, so a plain getByRole
 * picked the wrong one and reported an enabled control.
 */
const buyState = (page) =>
  page.evaluate(() => {
    const b = [...document.querySelectorAll("main button")].find(
      (el) =>
        !el.closest("li") &&
        /add to basket|sold out/i.test((el.textContent || "").trim()),
    );
    return b ? { label: (b.textContent || "").trim(), disabled: b.disabled } : null;
  });

let pass = 0, fail = 0, skipped = 0;
const skip = (name, why) => { console.log(`  SKIP  ${name}  — ${why}`); skipped++; };

/*
 * The stock checks need a fixture, because nothing is sold out on clean data:
 *
 *   update products set stock_status='out_of_stock' where slug='velours-matte';
 *   update products set stock_status='low_stock'    where slug='eclat-gloss';
 *   update shades set is_in_stock=false
 *     where product_id=(select id from products where slug='rouge-velmora')
 *       and sort_order=1;
 *
 * then `rm -rf .next && npm run build`, because the catalogue is `use cache`.
 */
const check = (name, ok, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (ok) pass++;
  else fail++;
};

// ---------------------------------------------------------------- shop all
console.log("\n/products — browse, search, sort");
await page.goto(`${BASE}/products`, { waitUntil: "networkidle" });
const cardCount = () => page.locator("main article").count();
const all = await cardCount();
check("lists the catalogue", all >= 10, `${all} cards`);
check("has a breadcrumb trail", (await page.locator('main nav[aria-label] ol li').count()) >= 2);
check("shows a result count", /\d+ products/i.test(await page.locator("main").innerText()));

// Sold out sorts last, and says so.
const firstCard = await page.locator("main article").first().innerText();
const hasFixture = (await page.getByText(/^sold out$/i).count()) > 0;
if (hasFixture) {
  check("sold-out items are not first", !/sold out/i.test(firstCard), firstCard.split("\n")[0]);
  check("a sold-out badge is rendered", true);
  check("a low-stock badge is rendered", (await page.getByText(/^low stock$/i).count()) > 0);
} else {
  skip("sold-out and low-stock badges", "no stock fixture; see the header");
}

// Search
await page.fill("#product-search", "grenat");           // a SHADE name, not a product
await page.waitForTimeout(700);
const searched = await cardCount();
check("searches shade names", searched > 0 && searched < all, `${searched} of ${all} for "grenat"`);
check("search writes to the URL", page.url().includes("q=grenat"), page.url().replace(BASE, ""));

// A discrete filter choice must be undoable with the back button — the thing
// component-only state could never do.
await page.fill("#product-search", "");
await page.waitForTimeout(600);
await page.getByRole("button", { name: "Lips", exact: true }).first().click();
await page.waitForTimeout(600);
const lipsOnly = await cardCount();
check("filter narrows the grid", lipsOnly > 0 && lipsOnly < all, `${lipsOnly} of ${all}`);
check("filter writes to the URL", page.url().includes("category=lips"));
await page.goBack();
await page.waitForTimeout(700);
check("back button undoes the filter", (await cardCount()) === all, `${await cardCount()} cards`);

// Sort
await page.selectOption("#product-sort", "price-asc");
await page.waitForTimeout(600);
const cards = await page.locator("main article").allInnerTexts();
const inStock = cards.filter((t) => !/sold out/i.test(t));
const nums = inStock
  .map((t) => Number((t.match(/₹\s?([\d,]+)/) || [])[1]?.replace(/,/g, "") || 0))
  .filter(Boolean);
const ascending = nums.every((n, i) => i === 0 || nums[i - 1] <= n);
check("sorts buyable items by price ascending", ascending && nums.length > 3, nums.join(" ≤ "));
if (hasFixture) {
  check("sold-out items stay last whatever the sort",
    cards.findIndex((t) => /sold out/i.test(t)) >= inStock.length,
    `first sold-out at ${cards.findIndex((t) => /sold out/i.test(t))} of ${cards.length}`);
} else {
  skip("sold-out items stay last", "no stock fixture");
}
check("sort writes to the URL", page.url().includes("sort=price-asc"));

// A shared/bookmarked filtered URL restores itself.
await page.goto(`${BASE}/products?category=lips&sort=name-asc`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
check("a shared filtered URL restores", (await page.locator('button[aria-pressed="true"]').count()) >= 1);

// ----------------------------------------------------- product page stock
if (hasFixture) {
console.log("\n/products/velours-matte — a sold-out product");
await page.goto(`${BASE}/products/velours-matte`, { waitUntil: "networkidle" });
const soldText = await page.locator("main").innerText();
check("says sold out", /sold out/i.test(soldText));
const buy = await buyState(page);
check("add to basket is disabled", buy?.disabled === true, JSON.stringify(buy));
check("no quantity stepper when unbuyable", (await page.locator("#product-search, [aria-label='Increase quantity']").count()) === 0);
const ld = await page.locator('script[type="application/ld+json"]').allInnerTexts();
check("JSON-LD offers say OutOfStock", ld.some((t) => t.includes("OutOfStock")), "");
check("JSON-LD has a price and currency", ld.some((t) => /"priceCurrency"\s*:\s*"INR"/.test(t) && /"price"/.test(t)));
check("BreadcrumbList structured data", ld.some((t) => t.includes("BreadcrumbList")));
} else {
  skip("sold-out product page and its OutOfStock structured data", "no stock fixture");
}

console.log("\n/products/rouge-velmora — shades, stock and quantity");
await page.goto(`${BASE}/products/rouge-velmora`, { waitUntil: "networkidle" });
// Breadcrumbs and offers are not fixture-dependent, so check them here too.
const ld2 = await page.locator('script[type="application/ld+json"]').allInnerTexts();
check("JSON-LD has a price and currency", ld2.some((t) => /"priceCurrency"\s*:\s*"INR"/.test(t)));
check("BreadcrumbList structured data", ld2.some((t) => t.includes("BreadcrumbList")));
const shadeBtns = page.locator("main ul li button[aria-label]");
const ariaLabels = await shadeBtns.evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
if (hasFixture) {
  check("sold-out shade is announced", ariaLabels.some((l) => /sold out/i.test(l || "")),
    ariaLabels.find((l) => /sold out/i.test(l || "")) || "");
} else {
  skip("sold-out shade states", "no stock fixture");
}
// Selecting it must disable buying.
if (hasFixture) {
  const soldShadeIndex = ariaLabels.findIndex((l) => /sold out/i.test(l || ""));
  await shadeBtns.nth(soldShadeIndex).click();
  await page.waitForTimeout(400);
  const soldState = await buyState(page);
  check("selecting a sold-out shade disables add", soldState?.disabled === true, JSON.stringify(soldState));
  check("and says so in a live region",
    (await page.locator('main [role="status"]').allInnerTexts()).some((t) => /sold out/i.test(t)));
}

// An in-stock shade enables buying. `Grenat` is a shade, not a gallery thumbnail
// — an earlier selector matched image buttons, which share this shape.
const okIndex = ariaLabels.findIndex((l) => l && !/sold out/i.test(l) && !/\s/.test(l));
await shadeBtns.nth(okIndex >= 0 ? okIndex : ariaLabels.length - 1).click();
await page.waitForTimeout(400);
const okState = await buyState(page);
check("an in-stock shade allows buying", okState?.disabled === false, JSON.stringify(okState));
await page.getByRole("button", { name: "Increase quantity" }).click();
await page.getByRole("button", { name: "Increase quantity" }).click();
await page.getByRole("button", { name: /add to basket/i }).first().click();
await page.waitForTimeout(900);
const basket = JSON.parse(await page.evaluate(() => localStorage.getItem("velmora.cart.v1") || "[]"));
check("quantity stepper is honoured", basket[0]?.quantity === 3, JSON.stringify(basket[0]));

// ------------------------------------------- related cards cannot add blind
console.log("\nrelated product cards");
await page.goto(`${BASE}/products/rouge-velmora`, { waitUntil: "networkidle" });
const related = page.locator("section").filter({ hasText: /complete the look/i }).locator("article").first();
const relSwatches = await related.locator("span[style*='background']").count();
check("related cards show their shades", relSwatches > 0, `${relSwatches} swatches`);
await page.evaluate(() => localStorage.removeItem("velmora.cart.v1"));
await page.reload({ waitUntil: "networkidle" });
const relAdd = page.locator("section").filter({ hasText: /complete the look/i }).locator("article").first()
  .getByRole("button", { name: /^add$/i });
if (await relAdd.count()) {
  await relAdd.click();
  await page.waitForTimeout(700);
  const after = JSON.parse(await page.evaluate(() => localStorage.getItem("velmora.cart.v1") || "[]"));
  const chooserShown = await page.getByText(/choose a shade/i).count();
  check("related Add asks for a shade instead of adding blind",
    after.length === 0 && chooserShown > 0,
    `basket=${JSON.stringify(after)} chooser=${chooserShown}`);
} else {
  check("related Add button present", false, "not found");
}

console.log(`\n${pass} passed, ${fail} failed, ${skipped} skipped`);
await browser.close();
process.exit(fail > 0 ? 1 : 0);
