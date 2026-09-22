import { Reveal } from "./reveal";

/**
 * The shared section opener. Every part is optional: a section with only a
 * headline, or only an eyebrow, still lays out correctly.
 */
export function SectionHeading({
  eyebrow,
  headline,
  subtext,
  align = "left",
  className = "",
  headingLevel = 2,
  children,
}: {
  eyebrow?: string | null;
  headline?: string | null;
  subtext?: string | null;
  align?: "left" | "center";
  className?: string;
  /** 1 when this is the page's own title, 2 under one. A page with no hero
   *  has no other source of an h1, and a page without one is a real defect. */
  headingLevel?: 1 | 2;
  children?: React.ReactNode;
}) {
  if (!eyebrow && !headline && !subtext && !children) return null;

  return (
    <Reveal className={`${align === "center" ? "text-center" : ""} ${className}`}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      {headline ? (
        <Headline
          level={headingLevel}
          className={`mt-5 text-4xl md:text-5xl lg:text-6xl ${align === "center" ? "mx-auto" : ""}`}
        >
          {headline}
        </Headline>
      ) : null}
      {subtext ? (
        <p
          className={`measure mt-6 text-ink-soft ${align === "center" ? "mx-auto" : ""}`}
        >
          {subtext}
        </p>
      ) : null}
      {children}
    </Reveal>
  );
}

/** A heading at the level the page needs, styled identically either way. */
function Headline({
  level,
  className,
  children,
}: {
  level: 1 | 2;
  className?: string;
  children: React.ReactNode;
}) {
  const Tag = level === 1 ? "h1" : "h2";
  return <Tag className={className}>{children}</Tag>;
}
