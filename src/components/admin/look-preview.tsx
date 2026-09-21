"use client";

import { useEffect, useRef, useState } from "react";
import { MakeupRenderer, type MakeupLayer } from "@/lib/try-on/makeup-renderer";
import { loadFaceLandmarker } from "@/lib/try-on/landmarker";

type Landmarks = { x: number; y: number }[];
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
      const landmarks = landmarker.detect(image).faceLandmarks?.[0];
      return landmarks ? { image, landmarks } : null;
    } catch {
      return null;
    }
  })();
  cache.set(url, job);
  return job;
}

/** The whole look rendered on a model photo, so it can be judged before publishing. */
export function LookPreview({
  photoUrl,
  layers,
  className = "",
}: {
  photoUrl: string | null;
  layers: MakeupLayer[];
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

  const signature = JSON.stringify(layers);

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
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = found.image.naturalWidth;
      canvas.height = found.image.naturalHeight;
      ctx.drawImage(found.image, 0, 0);

      if (layers.length > 0) {
        rendererRef.current ??= new MakeupRenderer();
        rendererRef.current.render(ctx, found.landmarks, canvas.width, canvas.height, layers);
      }
      setResult({ url: photoUrl, status: "ready" });
    });

    return () => {
      cancelled = true;
    };
    // `signature` captures the layer values; `layers` itself is a new array each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUrl, signature]);

  return (
    <div className={`relative overflow-hidden bg-canvas-soft ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full object-cover" aria-label="Look preview" />
      {status !== "ready" ? (
        <p className="absolute inset-0 flex items-center justify-center px-3 text-center text-[0.625rem] leading-relaxed text-ink-muted">
          {status === "loading"
            ? "Preparing preview…"
            : status === "noface"
              ? "No face found in the model photo."
              : "Add a try-on model photo to preview looks."}
        </p>
      ) : null}
    </div>
  );
}
