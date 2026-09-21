import { AdminHeader } from "@/components/admin/shell";
import { CsvExport } from "@/components/admin/csv-export";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";

export const instant = false;

export default async function NewsletterPage() {
  // Authorization is checked here, not only in the layout: layouts and
  // pages render in parallel, so a page can query before a layout redirect
  // lands. RLS blocks anything private either way, but this stops the work.
  await requireAdmin();

  const supabase = await createClient();
  const { data } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = data ?? [];

  return (
    <>
      <AdminHeader
        title="Newsletter"
        description="Everyone who has signed up for the letter. Only administrators can see this list."
        action={
          <CsvExport
            rows={rows.map((row) => ({
              email: row.email,
              signed_up: new Date(row.created_at).toISOString(),
              source: row.source ?? "",
            }))}
            columns={[
              { key: "email", header: "Email" },
              { key: "signed_up", header: "Signed up" },
              { key: "source", header: "Source" },
            ]}
            filename={`newsletter-${new Date().toISOString().slice(0, 10)}.csv`}
          />
        }
      />

      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">No subscribers yet.</p>
      ) : (
        <table className="w-full max-w-3xl border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="py-3 text-[0.625rem] tracking-[0.14em] text-ink-muted uppercase">Email</th>
              <th className="py-3 text-[0.625rem] tracking-[0.14em] text-ink-muted uppercase">Signed up</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line-soft">
                <td className="py-3">{row.email}</td>
                <td className="py-3 text-ink-muted">
                  {new Date(row.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
