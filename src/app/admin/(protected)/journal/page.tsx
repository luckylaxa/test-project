import { AdminHeader } from "@/components/admin/shell";
import { createClient } from "@/lib/supabase/server";
import { JournalForm } from "./journal-form";
import { requireAdmin } from "@/lib/admin/guard";

export const instant = false;

export default async function JournalAdminPage() {
  // Authorization is checked here, not only in the layout: layouts and
  // pages render in parallel, so a page can query before a layout redirect
  // lands. RLS blocks anything private either way, but this stops the work.
  await requireAdmin();

  const supabase = await createClient();
  const { data } = await supabase
    .from("journal_posts")
    .select("*")
    .order("published_at", { ascending: false });

  return (
    <>
      <AdminHeader title="Journal" description="Articles and notes from the maison." />
      <JournalForm posts={data ?? []} />
    </>
  );
}
