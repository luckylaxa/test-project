"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Link as LinkContent, SocialLink } from "@/lib/section-content";

/**
 * Sticky header: transparent over a hero, solid once scrolled.
 * Brand mark, navigation and socials all come from site_settings.
 */
export function Header({
  brandName,
  logoUrl,
  logoAlt,
  navLinks,
  socialLinks,
}: {
  brandName: string;
  logoUrl: string | null;
  logoAlt: string;
  navLinks: LinkContent[];
  socialLinks: SocialLink[];
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock scrolling behind the mobile menu, and let Escape close it.
  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const mark = logoUrl ? (
    <Image src={logoUrl} alt={logoAlt || brandName} width={148} height={32} className="h-6 w-auto md:h-7" priority />
  ) : (
    <span className="font-[family-name:var(--font-display)] text-xl tracking-[0.18em] uppercase md:text-2xl">
      {brandName}
    </span>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-700 ease-[var(--ease-editorial)] ${
        scrolled || menuOpen ? "bg-canvas/95 backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <div
        className={`shell flex items-center justify-between gap-6 transition-all duration-700 ease-[var(--ease-editorial)] ${
          scrolled ? "py-4" : "py-6 md:py-8"
        }`}
      >
        <Link href="/" className="shrink-0" aria-label={brandName}>
          {mark}
        </Link>

        {navLinks.length > 0 ? (
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-10">
              {navLinks.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={`${item.label}-${item.href}`}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className="group relative text-[0.6875rem] uppercase tracking-[0.2em] transition-colors duration-300 hover:text-accent"
                    >
                      {item.label}
                      <span
                        aria-hidden
                        className={`absolute -bottom-1.5 left-0 h-px bg-accent transition-all duration-500 ease-[var(--ease-editorial)] ${
                          active ? "w-full" : "w-0 group-hover:w-full"
                        }`}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        <button
          type="button"
          className="relative z-50 flex h-8 w-8 items-center justify-center lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span aria-hidden className="relative block h-3 w-6">
            <span
              className={`absolute left-0 block h-px w-6 bg-current transition-transform duration-500 ease-[var(--ease-editorial)] ${
                menuOpen ? "top-1.5 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 block h-px w-6 bg-current transition-transform duration-500 ease-[var(--ease-editorial)] ${
                menuOpen ? "top-1.5 -rotate-45" : "top-3"
              }`}
            />
          </span>
        </button>
      </div>

      <div className={`h-px bg-line transition-opacity duration-700 ${scrolled ? "opacity-100" : "opacity-0"}`} />

      {/* Mobile menu */}
      <div
        id="site-menu"
        hidden={!menuOpen}
        className="fixed inset-0 top-0 z-40 bg-canvas px-[var(--gutter)] pt-28 pb-12 lg:hidden"
      >
        <nav aria-label="Primary mobile">
          <ul className="flex flex-col gap-1">
            {navLinks.map((item, i) => (
              <li key={`${item.label}-${item.href}`} className="border-b border-line-soft">
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-5 font-[family-name:var(--font-display)] text-3xl"
                  style={{ transitionDelay: `${i * 40}ms` }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {socialLinks.length > 0 ? (
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            {socialLinks.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="eyebrow hover:text-accent"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </header>
  );
}
