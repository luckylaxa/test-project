import Link from "next/link";
import { AdminHeader } from "@/components/admin/shell";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";

// The panel is private and per-user: it reads the auth cookie on every request,
// so it renders at request time rather than being prerendered or cached.
export const instant = false;


/** Dashboard: what exists, and what needs attention. */
export default async function AdminDashboard() {
  // Authorization is checked here, not only in the layout: layouts and
  // pages render in parallel, so a page can query before a layout redirect
  // lands. RLS blocks anything private either way, but this stops the work.
  await requireAdmin();

  const supabase = await createClient();

  const counts = await Promise.all(
    (
      [
        ["products", "Products"],
        ["shades", "Shades"],
        ["collections", "Collections"],
        ["looks", "Curated looks"],
        ["journal_posts", "Journal posts"],
        ["testimonials", "Testimonials"],
      ] as const
    ).map(async ([table, label]) => {
      const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
      return { label, count: count ?? 0 };
    }),
  );

  const [{ count: subscribers }, { count: enquiries }, { count: openEnquiries }] =
    await Promise.all([
      supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
      supabase.from("enquiries").select("*", { count: "exact", head: true }),
      supabase
        .from("enquiries")
        .select("*", { count: "exact", head: true })
        .eq("is_handled", false),
    ]);

  const shortcuts = [
    { href: "/admin/pages", label: "Edit the home page", hint: "Headlines, images and section order" },
    { href: "/admin/products", label: "Add a product or shade", hint: "With a live preview of the colour" },
    { href: "/admin/looks", label: "Build a curated look", hint: "Combine shades across products" },
    { href: "/admin/settings", label: "Site settings", hint: "Logo, menu, contact details, accent colour" },
  ];

  return (
    <>
      <AdminHeader
        title="Dashboard"
        description="Everything on the website is edited from here. Changes appear on the live site within seconds of saving."
        action={
          <Link
            href="/"
            target="_blank"
            className="border border-line px-5 py-2.5 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:border-ink"
          >
            View live site
          </Link>
        }
      />

      <section>
        <h2 className="text-[0.6875rem] tracking-[0.16em] text-ink-muted uppercase">
          What&rsquo;s on the site
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
          {counts.map((item) => (
            <div key={item.label} className="bg-canvas p-5">
              <dt className="text-[0.625rem] tracking-[0.14em] text-ink-muted uppercase">
                {item.label}
              </dt>
              <dd className="mt-2 font-[family-name:var(--font-display)] text-3xl tabular-nums">
                {item.count}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-[0.6875rem] tracking-[0.16em] text-ink-muted uppercase">People</h2>
        <div className="mt-4 grid gap-px border border-line bg-line sm:grid-cols-2">
          <Link href="/admin/newsletter" className="group bg-canvas p-5 transition-colors hover:bg-canvas-soft">
            <p className="text-[0.625rem] tracking-[0.14em] text-ink-muted uppercase">
              Newsletter subscribers
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl tabular-nums">
              {subscribers ?? 0}
            </p>
          </Link>
          <Link href="/admin/enquiries" className="group bg-canvas p-5 transition-colors hover:bg-canvas-soft">
            <p className="text-[0.625rem] tracking-[0.14em] text-ink-muted uppercase">Enquiries</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl tabular-nums">
              {enquiries ?? 0}
            </p>
            {openEnquiries ? (
              <p className="mt-1 text-xs text-accent-text">{openEnquiries} awaiting a reply</p>
            ) : null}
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[0.6875rem] tracking-[0.16em] text-ink-muted uppercase">
          Common tasks
        </h2>
        <ul className="mt-4 grid gap-px border border-line bg-line sm:grid-cols-2">
          {shortcuts.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block bg-canvas p-5 transition-colors hover:bg-canvas-soft">
                <p className="font-[family-name:var(--font-display)] text-xl">{item.label}</p>
                <p className="mt-1 text-sm text-ink-muted">{item.hint}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
