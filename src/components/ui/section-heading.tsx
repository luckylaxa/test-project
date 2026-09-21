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
  children,
}: {
  eyebrow?: string | null;
  headline?: string | null;
  subtext?: string | null;
  align?: "left" | "center";
  className?: string;
  children?: React.ReactNode;
}) {
  if (!eyebrow && !headline && !subtext && !children) return null;

  return (
    <Reveal className={`${align === "center" ? "text-center" : ""} ${className}`}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      {headline ? (
        <h2 className={`mt-5 text-4xl md:text-5xl lg:text-6xl ${align === "center" ? "mx-auto" : ""}`}>
          {headline}
        </h2>
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
