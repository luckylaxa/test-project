import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/shell";
import { createClient } from "@/lib/supabase/server";
import { PageForm } from "./page-form";
import { requireAdmin } from "@/lib/admin/guard";

export const instant = false;

export default async function EditPagePage({ params }: { params: Promise<{ slug: string }> }) {
  // Authorization is checked here, not only in the layout: layouts and
  // pages render in parallel, so a page can query before a layout redirect
  // lands. RLS blocks anything private either way, but this stops the work.
  await requireAdmin();

  const { slug } = await params;
  const supabase = await createClient();

  const { data: page } = await supabase.from("pages").select("*").eq("slug", slug).maybeSingle();
  if (!page) notFound();

  const { data: sections } = await supabase
    .from("sections")
    .select("*")
    .eq("page_id", page.id)
    .order("sort_order");

  return (
    <>
      <AdminHeader
        title={page.title || slug}
        description="Build the page from sections. Everything here appears on the live site as soon as you save."
        action={
          <Link
            href="/admin/pages"
            className="border border-line px-5 py-2.5 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:border-ink"
          >
            All pages
          </Link>
        }
      />
      <PageForm page={page} sections={sections ?? []} />
    </>
  );
}
