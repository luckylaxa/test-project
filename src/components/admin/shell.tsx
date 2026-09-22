"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/** Navigation for the panel. Grouped the way a brand team thinks about the site. */
const NAV = [
  {
    group: "The website",
    links: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/pages", label: "Pages & sections" },
      { href: "/admin/settings", label: "Site settings" },
    ],
  },
  {
    group: "Products",
    links: [
      { href: "/admin/collections", label: "Collections" },
      { href: "/admin/products", label: "Products & shades" },
      { href: "/admin/looks", label: "Curated looks" },
      { href: "/admin/models", label: "Try-on models" },
    ],
  },
  {
    group: "Stories",
    links: [
      { href: "/admin/journal", label: "Journal" },
      { href: "/admin/testimonials", label: "Testimonials" },
      { href: "/admin/press", label: "Press logos" },
    ],
  },
  {
    group: "Customers",
    links: [
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/newsletter", label: "Newsletter" },
      { href: "/admin/enquiries", label: "Enquiries" },
    ],
  },
];

export function AdminShell({
  email,
  brandName,
  signOut,
  children,
}: {
  email: string;
  brandName: string;
  signOut: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="space-y-7">
      {NAV.map((section) => (
        <div key={section.group}>
          <p className="text-[0.625rem] tracking-[0.18em] text-ink-muted uppercase">
            {section.group}
          </p>
          <ul className="mt-3 space-y-1">
            {section.links.map((link) => {
              const active =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`block py-1.5 text-sm transition-colors duration-200 ${
                      active ? "text-accent" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Sidebar */}
      <aside className="hidden border-r border-line bg-canvas-soft px-6 py-8 lg:block">
        <Link href="/admin" className="font-[family-name:var(--font-display)] text-lg tracking-[0.14em] uppercase">
          {brandName}
        </Link>
        <p className="mt-1 text-[0.625rem] tracking-[0.16em] text-ink-muted uppercase">
          Content manager
        </p>

        <div className="mt-10">{nav}</div>

        <div className="mt-10 border-t border-line pt-5">
          <p className="truncate text-xs text-ink-muted">{email}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-2 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:text-accent"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile bar */}
      <div className="flex items-center justify-between border-b border-line px-5 py-4 lg:hidden">
        <Link href="/admin" className="font-[family-name:var(--font-display)] text-base tracking-[0.14em] uppercase">
          {brandName}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="text-[0.6875rem] tracking-[0.16em] uppercase"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="border-b border-line bg-canvas-soft px-5 py-6 lg:hidden">
          {nav}
          <form action={signOut} className="mt-8 border-t border-line pt-4">
            <p className="truncate text-xs text-ink-muted">{email}</p>
            <button
              type="submit"
              className="mt-2 text-[0.6875rem] tracking-[0.16em] uppercase hover:text-accent"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}

      <div className="min-w-0 px-5 py-8 md:px-8 lg:px-10 lg:py-10">{children}</div>
    </div>
  );
}

/** Page header used by every editor screen. */
export function AdminHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-xl text-sm text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
