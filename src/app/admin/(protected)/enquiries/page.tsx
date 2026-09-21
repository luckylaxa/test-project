import { AdminHeader } from "@/components/admin/shell";
import { CsvExport } from "@/components/admin/csv-export";
import { createClient } from "@/lib/supabase/server";
import { EnquiryRow } from "./enquiry-row";
import { requireAdmin } from "@/lib/admin/guard";

export const instant = false;

export default async function EnquiriesPage() {
  // Authorization is checked here, not only in the layout: layouts and
  // pages render in parallel, so a page can query before a layout redirect
  // lands. RLS blocks anything private either way, but this stops the work.
  await requireAdmin();

  const supabase = await createClient();
  const { data } = await supabase
    .from("enquiries")
    .select("*, product:products(name)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as (NonNullable<typeof data>[number] & {
    product: { name: string } | null;
  })[];

  const open = rows.filter((row) => !row.is_handled).length;

  return (
    <>
      <AdminHeader
        title="Enquiries"
        description={
          open > 0
            ? `${open} message${open === 1 ? "" : "s"} still waiting for a reply.`
            : "Messages sent through the contact form."
        }
        action={
          <CsvExport
            rows={rows.map((row) => ({
              received: new Date(row.created_at).toISOString(),
              name: row.name,
              email: row.email,
              subject: row.subject ?? "",
              product: row.product?.name ?? "",
              message: row.message,
              answered: row.is_handled ? "yes" : "no",
            }))}
            columns={[
              { key: "received", header: "Received" },
              { key: "name", header: "Name" },
              { key: "email", header: "Email" },
              { key: "subject", header: "Subject" },
              { key: "product", header: "Product" },
              { key: "message", header: "Message" },
              { key: "answered", header: "Answered" },
            ]}
            filename={`enquiries-${new Date().toISOString().slice(0, 10)}.csv`}
          />
        }
      />

      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">No enquiries yet.</p>
      ) : (
        <ul className="max-w-3xl border-t border-line">
          {rows.map((row) => (
            <EnquiryRow
              key={row.id}
              id={row.id}
              name={row.name}
              email={row.email}
              subject={row.subject}
              message={row.message}
              productName={row.product?.name ?? null}
              createdAt={row.created_at}
              handled={row.is_handled}
            />
          ))}
        </ul>
      )}
    </>
  );
}
