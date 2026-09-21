import Link from "next/link";
import type { Link as LinkContent } from "@/lib/section-content";

type Variant = "solid" | "line" | "quiet";

const base =
  "inline-flex items-center justify-center gap-2 px-7 py-3 text-[0.6875rem] uppercase " +
  "tracking-[0.2em] transition-colors duration-500 ease-[var(--ease-editorial)]";

const variants: Record<Variant, string> = {
  solid: "bg-ink text-canvas hover:bg-accent hover:text-ink",
  line: "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-canvas",
  quiet: "border border-canvas/40 text-canvas hover:bg-canvas hover:text-ink",
};

/** Renders nothing unless the editor supplied both a label and a destination. */
export function ButtonLink({
  content,
  variant = "line",
  className = "",
}: {
  content: LinkContent | null;
  variant?: Variant;
  className?: string;
}) {
  if (!content) return null;
  const external = /^https?:\/\//i.test(content.href);

  if (external) {
    return (
      <a
        href={content.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${variants[variant]} ${className}`}
      >
        {content.label}
      </a>
    );
  }

  return (
    <Link href={content.href} className={`${base} ${variants[variant]} ${className}`}>
      {content.label}
    </Link>
  );
}

/** Understated text link with a hairline that draws in on hover. */
export function TextLink({
  content,
  className = "",
}: {
  content: LinkContent | null;
  className?: string;
}) {
  if (!content) return null;
  return (
    <Link
      href={content.href}
      className={`group inline-flex items-center gap-3 text-[0.6875rem] uppercase tracking-[0.2em] ${className}`}
    >
      <span>{content.label}</span>
      <span
        aria-hidden
        className="h-px w-8 bg-ink/30 transition-all duration-500 ease-[var(--ease-editorial)] group-hover:w-12 group-hover:bg-accent"
      />
    </Link>
  );
}
