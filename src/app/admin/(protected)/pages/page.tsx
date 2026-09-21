import Link from "next/link";
import { AdminHeader } from "@/components/admin/shell";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";

export const instant = false;

export default async function PagesAdminPage() {
  // Authorization is checked here, not only in the layout: layouts and
  // pages render in parallel, so a page can query before a layout redirect
  // lands. RLS blocks anything private either way, but this stops the work.
  await requireAdmin();

  const supabase = await createClient();
  const { data: pages } = await supabase.from("pages").select("*").order("slug");

  const counts = new Map<string, number>();
  const { data: sections } = await supabase.from("sections").select("page_id");
  for (const section of sections ?? []) {
    counts.set(section.page_id, (counts.get(section.page_id) ?? 0) + 1);
  }

  return (
    <>
      <AdminHeader
        title="Pages & sections"
        description="Every page on the website. Open one to edit its wording, images and the order of its sections."
      />

      <ul className="max-w-3xl divide-y divide-line border-y border-line">
        {(pages ?? []).map((page) => (
          <li key={page.id}>
            <Link
              href={`/admin/pages/${page.slug}`}
              className="flex items-center justify-between gap-4 py-4 transition-colors hover:text-accent"
            >
              <span>
                <span className="block font-[family-name:var(--font-display)] text-xl">
                  {page.title || page.slug}
                </span>
                <span className="block text-[0.625rem] tracking-[0.12em] text-ink-muted uppercase">
                  {page.slug === "home" ? "/" : `/${page.slug}`} · {counts.get(page.id) ?? 0} section
                  {(counts.get(page.id) ?? 0) === 1 ? "" : "s"}
                  {page.is_published ? "" : " · not published"}
                </span>
              </span>
              <span aria-hidden className="text-ink-muted">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
