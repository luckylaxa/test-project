import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin/guard";
import { getSiteSettings } from "@/lib/content";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Reads the auth cookie to bounce an already-signed-in admin, so it renders at
// request time like the rest of the panel.
export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const [{ denied }, admin, settings] = await Promise.all([
    searchParams,
    currentAdmin(),
    getSiteSettings(),
  ]);

  if (admin) redirect("/admin");

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="eyebrow text-center">{settings?.brand_name ?? ""}</p>
        <h1 className="mt-4 text-center font-[family-name:var(--font-display)] text-3xl">
          Content manager
        </h1>
        <p className="mt-3 text-center text-sm text-ink-muted">
          Sign in to edit the website.
        </p>

        <div className="mt-10">
          <LoginForm denied={denied === "1"} />
        </div>
      </div>
    </main>
  );
}
