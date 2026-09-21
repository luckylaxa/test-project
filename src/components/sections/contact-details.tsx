import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { obj, text } from "@/lib/section-content";
import type { Json } from "@/lib/types/database";
import type { SiteSettings } from "@/lib/content";

/** Contact details, pulled from site_settings so they are never written twice. */
export function ContactDetailsSection({
  content,
  settings,
}: {
  content: Json;
  settings: SiteSettings | null;
}) {
  const c = obj(content);
  const entries = [
    { label: text(c.email_label), value: settings?.contact_email, href: (v: string) => `mailto:${v}` },
    {
      label: text(c.phone_label),
      value: settings?.contact_phone,
      href: (v: string) => `tel:${v.replace(/\s+/g, "")}`,
    },
    { label: text(c.address_label), value: settings?.contact_address, href: null },
  ].filter((entry) => Boolean(entry.value));

  if (entries.length === 0) return null;

  return (
    <section className="shell py-16 md:py-20">
      <SectionHeading eyebrow={text(c.eyebrow)} headline={text(c.headline)} subtext={text(c.subtext)} />
      <dl className="mt-12 grid gap-px border-t border-line bg-line sm:grid-cols-3">
        {entries.map((entry, i) => (
          <Reveal key={entry.label ?? i} delay={i * 80} className="bg-canvas p-8">
            {entry.label ? <dt className="eyebrow">{entry.label}</dt> : null}
            <dd className="mt-3 whitespace-pre-line">
              {entry.href ? (
                <a
                  href={entry.href(entry.value as string)}
                  className="transition-colors duration-300 hover:text-accent"
                >
                  {entry.value}
                </a>
              ) : (
                entry.value
              )}
            </dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
