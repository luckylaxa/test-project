"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Link as LinkContent, SocialLink } from "@/lib/section-content";
import { CartButton } from "@/components/cart/cart-drawer";

/**
 * Sticky header: transparent over a hero, solid once scrolled.
 * Brand mark, navigation and socials all come from site_settings.
 */
export function Header({
  brandName,
  logoUrl,
  logoLightUrl,
  logoAlt,
  navLinks,
  socialLinks,
  labels,
  showCart = false,
}: {
  brandName: string;
  logoUrl: string | null;
  /** Light colourway, for the transparent header over a hero. */
  logoLightUrl: string | null;
  logoAlt: string;
  navLinks: LinkContent[];
  socialLinks: SocialLink[];
  labels: {
    navPrimary: string;
    menuOpen: string;
    menuClose: string;
    cart: string;
    account: string;
    search: string;
  };
  showCart?: boolean;
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

  // Two colourways, stacked and swapped in CSS rather than in JS: the header is
  // transparent over a hero and its type is flipped to light there, so a dark
  // mark would vanish into the photograph. Doing it in CSS means no flash on
  // first paint and no second render on scroll. The light one is absolutely
  // positioned so it cannot add to the layout, and both are the same artwork at
  // the same size, so the swap does not shift anything.
  const mark = logoUrl ? (
    <span className="relative inline-block">
      <Image
        src={logoUrl}
        alt={logoAlt || brandName}
        width={157}
        height={50}
        className="h-8 w-auto md:h-9"
        data-logo="dark"
        priority
      />
      {logoLightUrl ? (
        <Image
          src={logoLightUrl}
          alt=""
          aria-hidden
          width={157}
          height={50}
          className="absolute inset-0 h-8 w-auto md:h-9"
          data-logo="light"
          priority
        />
      ) : null}
    </span>
  ) : (
    <span className="font-[family-name:var(--font-display)] text-xl tracking-[0.18em] uppercase md:text-2xl">
      {brandName}
    </span>
  );

  return (
    <>
    <header
      data-site-header=""
      data-solid={scrolled || menuOpen}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-700 ease-[var(--ease-editorial)] ${
        scrolled || menuOpen ? "bg-canvas/95 backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <div
        className={`shell flex items-center justify-between gap-6 transition-all duration-700 ease-[var(--ease-editorial)] ${
          scrolled ? "py-4" : "py-6 md:py-8"
        }`}
      >
        <Link href="/" className="tap shrink-0" aria-label={brandName}>
          {mark}
        </Link>

        {navLinks.length > 0 ? (
          <nav aria-label={labels.navPrimary} className="hidden lg:block">
            <ul className="flex items-center gap-10">
              {navLinks.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={`${item.label}-${item.href}`}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className="tap group relative text-[0.6875rem] uppercase tracking-[0.2em] transition-colors duration-300 hover:text-accent-text"
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

        <div className="flex items-center gap-6">
          <Link
            href="/products?focus=search"
            className="tap text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-300 hover:text-accent-text"
          >
            {labels.search}
          </Link>
          {showCart ? (
            <Link
              href="/account"
              className="tap hidden text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-300 hover:text-accent-text sm:inline-flex"
            >
              {labels.account}
            </Link>
          ) : null}
          {showCart ? <CartButton label={labels.cart} /> : null}

          <button
            type="button"
            className="relative z-50 flex h-8 w-8 items-center justify-center lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? labels.menuClose : labels.menuOpen}
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
      </div>

      <div className={`h-px bg-line transition-opacity duration-700 ${scrolled ? "opacity-100" : "opacity-0"}`} />
    </header>

      {/* Mobile menu — a sibling of <header>, never a child of it.
          The header carries `backdrop-blur` once it turns solid, and
          `backdrop-filter` makes an element a containing block for its
          `position: fixed` descendants. Nested, this panel's `inset-0`
          resolved against the 77px header instead of the viewport: measured
          160px tall on a 812px screen, so its background stopped under the bar
          and its links floated over the footer. Keeping it outside means no
          filter, transform or `will-change` added to the header later can
          silently trap it again. */}
      <div
        id="site-menu"
        hidden={!menuOpen}
        className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-canvas px-[var(--gutter)] pt-28 pb-12 lg:hidden"
      >
        <nav aria-label={labels.navPrimary}>
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
        {/* Your account is `hidden sm:inline-flex` in the bar, so on a phone
            orders and saved items had no route at all short of typing the URL.
            The menu is where a phone expects to find them. */}
        <ul className="mt-8 flex flex-col gap-1 border-t border-line pt-4">
          <li>
            <Link
              href="/products?focus=search"
              onClick={() => setMenuOpen(false)}
              className="tap text-[0.6875rem] tracking-[0.2em] uppercase"
            >
              {labels.search}
            </Link>
          </li>
          {showCart ? (
            <li>
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="tap text-[0.6875rem] tracking-[0.2em] uppercase"
              >
                {labels.account}
              </Link>
            </li>
          ) : null}
        </ul>

        {socialLinks.length > 0 ? (
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            {socialLinks.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="eyebrow hover:text-accent-text"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
}
