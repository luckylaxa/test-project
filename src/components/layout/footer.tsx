import Image from "next/image";
import Link from "next/link";
import type { FooterColumn, Link as LinkContent, SocialLink } from "@/lib/section-content";

/** Footer. Every block hides itself when its content is empty. */
export function Footer({
  brandName,
  logoUrl,
  logoAlt,
  footerText,
  columns,
  socialLinks,
  legalLinks,
  contactEmail,
  contactPhone,
  contactAddress,
  contactTitle,
  year,
}: {
  brandName: string;
  logoUrl: string | null;
  logoAlt: string;
  footerText: string | null;
  columns: FooterColumn[];
  socialLinks: SocialLink[];
  legalLinks: LinkContent[];
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  contactTitle: string;
  year: number;
}) {
  const hasContact = Boolean(contactEmail || contactPhone || contactAddress);

  return (
    <footer className="mt-32 border-t border-line bg-canvas-soft">
      <div className="shell py-20 md:py-24">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href="/" aria-label={brandName} className="inline-block">
              {logoUrl ? (
                <Image src={logoUrl} alt={logoAlt || brandName} width={157} height={50} className="h-9 w-auto" />
              ) : (
                <span className="font-[family-name:var(--font-display)] text-2xl tracking-[0.18em] uppercase">
                  {brandName}
                </span>
              )}
            </Link>
            {footerText ? <p className="measure mt-6 text-sm text-ink-soft">{footerText}</p> : null}
          </div>

          {columns.map((column) => (
            <nav key={column.title ?? column.links[0]?.href} className="md:col-span-2" aria-label={column.title ?? undefined}>
              {column.title ? <p className="eyebrow">{column.title}</p> : null}
              {column.links.length > 0 ? (
                <ul className="mt-5 space-y-3">
                  {column.links.map((item) => (
                    <li key={`${item.label}-${item.href}`}>
                      <Link href={item.href} className="tap-sm text-sm text-ink-soft transition-colors duration-300 hover:text-accent-text">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </nav>
          ))}

          {hasContact ? (
            <div className="md:col-span-3">
              <p className="eyebrow">{contactTitle}</p>
              <address className="mt-5 space-y-3 text-sm not-italic text-ink-soft">
                {contactAddress ? <p className="whitespace-pre-line">{contactAddress}</p> : null}
                {contactEmail ? (
                  <p>
                    <a href={`mailto:${contactEmail}`} className="tap-sm transition-colors duration-300 hover:text-accent-text">
                      {contactEmail}
                    </a>
                  </p>
                ) : null}
                {contactPhone ? (
                  <p>
                    <a href={`tel:${contactPhone.replace(/\s+/g, "")}`} className="tap-sm transition-colors duration-300 hover:text-accent-text">
                      {contactPhone}
                    </a>
                  </p>
                ) : null}
              </address>
            </div>
          ) : null}
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase">
            &copy; {year} {brandName}
          </p>

          {socialLinks.length > 0 ? (
            <ul className="flex flex-wrap gap-x-7 gap-y-2">
              {socialLinks.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-sm text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase transition-colors duration-300 hover:text-accent-text"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {legalLinks.length > 0 ? (
            <ul className="flex flex-wrap gap-x-7 gap-y-2">
              {legalLinks.map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <Link
                    href={item.href}
                    className="text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase transition-colors duration-300 hover:text-accent-text"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
