import Link from "next/link";
import { jsonLdScript } from "@/lib/sanitize";
import { siteUrl } from "@/lib/metadata";

export type Crumb = { label: string; href: string };

/**
 * Where you are, and the way back up.
 *
 * Also emits `BreadcrumbList` structured data, which is what puts the trail
 * under a search result instead of a bare URL. The last crumb is the current
 * page, so it is text rather than a link and carries `aria-current`.
 */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  if (trail.length < 2) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.label,
      item: `${siteUrl()}${crumb.href}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <nav aria-label={trail[0].label}>
        <ol className="flex flex-wrap items-center gap-x-2 text-[0.625rem] tracking-[0.16em] text-ink-muted uppercase">
          {trail.map((crumb, i) => {
            const last = i === trail.length - 1;
            return (
              <li key={crumb.href + i} className="flex items-center gap-x-2">
                {last ? (
                  <span aria-current="page" className="tap-sm text-ink">
                    {crumb.label}
                  </span>
                ) : (
                  <>
                    <Link href={crumb.href} className="tap-sm transition-colors hover:text-accent-text">
                      {crumb.label}
                    </Link>
                    <span aria-hidden className="text-ink-muted/60">
                      /
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
