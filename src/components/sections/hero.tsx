import { MediaFrame } from "@/components/ui/media";
import { ButtonLink } from "@/components/ui/button";
import { link, media, obj, text } from "@/lib/section-content";
import type { Json } from "@/lib/types/database";

/**
 * Full-bleed hero. With media it is an image/video stage with copy over it;
 * without media it degrades to a quiet editorial page opener.
 */
export function HeroSection({ content, first }: { content: Json; first: boolean }) {
  const c = obj(content);
  const eyebrow = text(c.eyebrow);
  const headline = text(c.headline);
  const subtext = text(c.subtext);
  const image = media(c.media);
  const primary = link(c.primary_button);
  const secondary = link(c.secondary_button);

  if (!eyebrow && !headline && !subtext && !image && !primary && !secondary) return null;

  if (!image) {
    return (
      <section className="shell pt-40 pb-16 md:pt-52 md:pb-24">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {headline ? <h1 className="mt-6 text-5xl md:text-7xl lg:text-8xl">{headline}</h1> : null}
        {subtext ? <p className="measure mt-8 text-lg text-ink-soft">{subtext}</p> : null}
        {primary || secondary ? (
          <div className="mt-10 flex flex-wrap gap-4">
            <ButtonLink content={primary} variant="solid" />
            <ButtonLink content={secondary} variant="line" />
          </div>
        ) : null}
        <hr className="rule mt-16" />
      </section>
    );
  }

  return (
    <section
      // The header reads this to switch to light type while it is transparent
      // over the image. Without it, dark type disappears into a dark photograph.
      data-hero-media="true"
      className="relative isolate min-h-[88svh] w-full overflow-hidden md:min-h-screen"
    >
      <div className="absolute inset-0">
        <MediaFrame media={image} className="h-full w-full" sizes="100vw" priority={first} />
      </div>
      {/* Scrim: keeps text legible over any photograph without darkening the image. */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/15 to-ink/25" />

      <div className="relative z-10 flex min-h-[88svh] items-end pb-16 md:min-h-screen md:pb-24">
        <div className="shell text-canvas">
          {eyebrow ? <p className="eyebrow text-canvas/75">{eyebrow}</p> : null}
          {headline ? (
            <h1 className="mt-6 max-w-[16ch] text-5xl md:text-7xl lg:text-8xl">{headline}</h1>
          ) : null}
          {subtext ? <p className="measure mt-7 text-canvas/85 md:text-lg">{subtext}</p> : null}
          {primary || secondary ? (
            <div className="mt-10 flex flex-wrap gap-4">
              <ButtonLink content={primary} variant="invert" />
              <ButtonLink content={secondary} variant="quiet" />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
