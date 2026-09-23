/**
 * The server-side checkout refusals, replayed straight at the server action.
 *
 * The basket UI also blocks these, but the UI is not the protection: anyone can
 * edit localStorage and POST the action themselves. (Forcing the click in the
 * page cannot work — React refuses to dispatch to a button whose props say
 * disabled, whatever the DOM attribute says — so this talks to the action the
 * way an attacker would instead.)
 *
 * Every gate below sits BEFORE the sign-in gate in `createCheckout`, so a
 * signed-out replay reaches all of them.
 *
 * Run: node qa/verify-gates.mjs <next-action-id>
 */
const BASE = "http://localhost:3100";
const ACTION = process.argv[2];
if (!ACTION) {
  console.error("usage: node qa/verify-gates.mjs <next-action-id from a captured checkout POST>");
  process.exit(2);
}

const P = { rouge: "134c67d8-5c5b-478e-af7c-26c58844303a", velours: "cf63ea73-65c4-489c-8d4d-145ac9eb6d9d" };
const S = {
  rougeMaisonSoldOut: "682949ac-90d7-4820-af32-88933171f1e8",
  grenat: "f67eb125-e88e-4192-b963-e08274e57a1e",
  rougeNoir: "537fe355-fafe-451d-af95-1cd0249b3e5f",
};

let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (ok) pass++;
  else fail++;
};

async function call(lines) {
  const res = await fetch(BASE + "/", {
    method: "POST",
    headers: { "Next-Action": ACTION, "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify([lines]),
  });
  return res.text();
}

const cases = [
  {
    name: "a shadeless line for a product that has shades",
    lines: [{ productId: P.rouge, shadeId: null, quantity: 1 }],
    expect: "checkout_error_shade_required",
  },
  {
    name: "a sold-out shade",
    lines: [{ productId: P.rouge, shadeId: S.rougeMaisonSoldOut, quantity: 1 }],
    expect: "checkout_error_shade_sold_out",
  },
  {
    name: "a sold-out product, whose shade is itself in stock",
    lines: [{ productId: P.velours, shadeId: S.rougeNoir, quantity: 1 }],
    expect: "checkout_error_sold_out",
  },
  {
    // The product must be in stock, or the product-level refusal fires first —
    // which is the right order, and caught this test expecting the wrong one.
    name: "a shade that does not belong to the product",
    lines: [{ productId: P.rouge, shadeId: S.rougeNoir, quantity: 1 }],
    expect: "checkout_error_shade_gone",
  },
  {
    name: "an empty basket",
    lines: [],
    expect: "checkout_error_empty",
  },
  {
    name: "a forged unit price is ignored (the server re-reads it)",
    lines: [{ productId: P.rouge, shadeId: S.grenat, quantity: 1, unitAmount: 1, price: 1 }],
    expect: "checkout_error_sign_in",
  },
  {
    name: "a good line reaches the sign-in gate, not a blanket refusal",
    lines: [{ productId: P.rouge, shadeId: S.grenat, quantity: 2 }],
    expect: "checkout_error_sign_in",
  },
];

for (const c of cases) {
  const body = await call(c.lines);
  const got = (body.match(/checkout_error_[a-z_]+/) || ["(none)"])[0];
  check(c.name, got === c.expect, `expected ${c.expect}, got ${got}`);
}

// Quantity is clamped server side, so a huge number cannot be charged for.
const huge = await call([{ productId: P.rouge, shadeId: S.grenat, quantity: 99999 }]);
check("an absurd quantity is not refused outright but clamped",
  /checkout_error_sign_in/.test(huge), (huge.match(/checkout_error_[a-z_]+/) || ["(none)"])[0]);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
