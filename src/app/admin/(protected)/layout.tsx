import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/shell";
import { requireAdmin } from "@/lib/admin/guard";
import { signOutAction } from "@/lib/admin/actions";
import { getSiteSettings } from "@/lib/content";

// The panel is private and per-user: it reads the auth cookie on every request,
// so it renders at request time rather than being prerendered or cached.
export const instant = false;


// Belt and braces alongside robots.txt: the panel must never be indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, settings] = await Promise.all([requireAdmin(), getSiteSettings()]);

  return (
    <AdminShell
      email={admin.email}
      brandName={settings?.brand_name ?? ""}
      signOut={signOutAction}
    >
      {children}
    </AdminShell>
  );
}
