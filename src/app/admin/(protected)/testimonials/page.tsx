import { AdminHeader } from "@/components/admin/shell";
import { createClient } from "@/lib/supabase/server";
import { TestimonialsForm } from "./testimonials-form";
import { requireAdmin } from "@/lib/admin/guard";

export const instant = false;

export default async function TestimonialsAdminPage() {
  // Authorization is checked here, not only in the layout: layouts and
  // pages render in parallel, so a page can query before a layout redirect
  // lands. RLS blocks anything private either way, but this stops the work.
  await requireAdmin();

  const supabase = await createClient();
  const { data } = await supabase.from("testimonials").select("*").order("sort_order");

  return (
    <>
      <AdminHeader
        title="Testimonials"
        description="Quotes from customers, shown on the home page."
      />
      <TestimonialsForm testimonials={data ?? []} />
    </>
  );
}
