import type { ShadeRow } from "@/lib/content";

/** A shade dot. Gloss and shimmer finishes get a soft specular highlight. */
export function Swatch({
  shade,
  size = 32,
  className = "",
}: {
  shade: Pick<ShadeRow, "hex" | "finish" | "name">;
  size?: number;
  className?: string;
}) {
  const lustrous = shade.finish === "gloss" || shade.finish === "shimmer";
  return (
    <span
      className={`inline-block rounded-full ring-1 ring-ink/10 ${className}`}
      style={{
        width: size,
        height: size,
        background: lustrous
          ? `radial-gradient(circle at 32% 28%, rgba(255,255,255,.55), rgba(255,255,255,0) 46%), ${shade.hex}`
          : shade.hex,
      }}
      title={shade.name}
    />
  );
}
