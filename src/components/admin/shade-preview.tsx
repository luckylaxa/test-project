"use client";

import { useEffect, useRef, useState } from "react";
import { MakeupRenderer, type Category, type Finish } from "@/lib/try-on/makeup-renderer";
import { loadFaceLandmarker } from "@/lib/try-on/landmarker";

type Landmarks = { x: number; y: number }[];

// One detection per model photo, shared by every preview on the screen. Without
// this, a product with six shades would run the face detector six times.
const cache = new Map<string, Promise<{ image: HTMLImageElement; landmarks: Landmarks } | null>>();

function analyse(url: string) {
  const existing = cache.get(url);
  if (existing) return existing;

  const job = (async () => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = url;
    try {
      await image.decode();
    } catch {
      return null;
    }
    try {
      const landmarker = await loadFaceLandmarker();
      landmarker.setOptions({ runningMode: "IMAGE" });
      const result = landmarker.detect(image);
      const landmarks = result.faceLandmarks?.[0];
      return landmarks ? { image, landmarks } : null;
    } catch {
      return null;
    }
  })();

  cache.set(url, job);
  return job;
}

/**
 * Shows a shade applied to a sample model photo, using the same renderer the
 * public try-on uses.
 *
 * This exists so the team can judge a colour before publishing it. A hex swatch
 * tells you almost nothing about how a shade will actually read on skin.
 */
export function ShadePreview({
  photoUrl,
  hex,
  finish,
  intensity,
  category,
  className = "",
}: {
  photoUrl: string | null;
  hex: string;
  finish: Finish;
  intensity: number;
  category: Category;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<MakeupRenderer | null>(null);
  // Derived, not stored: setting it inside the effect body would cascade a
  // render on every keystroke of the colour field.
  const [result, setResult] = useState<{ url: string; status: "ready" | "noface" } | null>(null);
  const status: "loading" | "ready" | "noface" | "nomodel" = !photoUrl
    ? "nomodel"
    : result?.url === photoUrl
      ? result.status
      : "loading";

  useEffect(() => {
    if (!photoUrl) return;
    let cancelled = false;

    void analyse(photoUrl).then((found) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (!found) {
        setResult({ url: photoUrl, status: "noface" });
        return;
      }

      const { image, landmarks } = found;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.drawImage(image, 0, 0);

      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        rendererRef.current ??= new MakeupRenderer();
        rendererRef.current.render(ctx, landmarks, canvas.width, canvas.height, [
          { category, hex, finish, intensity },
        ]);
      }
      setResult({ url: photoUrl, status: "ready" });
    });

    return () => {
      cancelled = true;
    };
  }, [photoUrl, hex, finish, intensity, category]);

  return (
    <div className={`relative overflow-hidden bg-canvas-soft ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full object-cover" aria-label="Shade preview" />
      {status !== "ready" ? (
        <p className="absolute inset-0 flex items-center justify-center px-3 text-center text-[0.625rem] leading-relaxed text-ink-muted">
          {status === "loading"
            ? "Preparing preview…"
            : status === "noface"
              ? "No face found in the model photo."
              : "Add a try-on model photo to preview shades."}
        </p>
      ) : null}
    </div>
  );
}
