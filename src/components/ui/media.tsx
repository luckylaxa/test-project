import Image from "next/image";
import type { Media } from "@/lib/section-content";

/**
 * Image or muted looping video, sized by its container.
 * Returns null when there is no media, so callers can lay out around an absence
 * instead of rendering a broken frame.
 */
export function MediaFrame({
  media,
  className = "",
  sizes = "100vw",
  priority = false,
  ratio,
}: {
  media: Media | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
  ratio?: string;
}) {
  if (!media) return null;

  const frame = `relative overflow-hidden bg-canvas-soft ${className}`;
  const style = ratio ? { aspectRatio: ratio } : undefined;

  if (media.type === "video") {
    return (
      <div className={frame} style={style}>
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={media.url}
          poster={media.posterUrl ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          aria-label={media.alt || undefined}
        />
      </div>
    );
  }

  return (
    <div className={frame} style={style}>
      <Image
        src={media.url}
        alt={media.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
