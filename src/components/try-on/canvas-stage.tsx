"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { MakeupRenderer, type MakeupLayer } from "@/lib/try-on/makeup-renderer";
import { LandmarkSmoother } from "@/lib/try-on/smoothing";
import { loadFaceLandmarker, releaseFaceLandmarker } from "@/lib/try-on/landmarker";

export type StageSource =
  | { kind: "camera"; stream: MediaStream }
  | { kind: "image"; url: string; mirrored?: boolean };

export type StageHandle = {
  /** Draws the current frame to a PNG and hands it back as a blob URL. */
  snapshot: () => string | null;
};

export type FaceState = "loading" | "searching" | "tracking" | "error";

/**
 * Draws the source and paints the makeup on top.
 *
 * Nothing here ever uploads, records or transmits a frame: the video element,
 * the canvases and the model all live in this tab, and the stream is stopped
 * the moment the component goes away.
 */
export function CanvasStage({
  source,
  layers,
  comparing,
  onFaceState,
  handleRef,
  className = "",
}: {
  source: StageSource | null;
  layers: MakeupLayer[];
  comparing: boolean;
  onFaceState?: (state: FaceState) => void;
  handleRef?: React.RefObject<StageHandle | null>;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rendererRef = useRef<MakeupRenderer | null>(null);
  const smootherRef = useRef(new LandmarkSmoother());
  const frameRef = useRef<number | null>(null);
  const lastLandmarksRef = useRef<{ x: number; y: number }[] | null>(null);

  // Held in refs so the render loop always sees current values without being
  // torn down and restarted every time a shade changes. Synced in an effect
  // rather than during render, which React forbids.
  const layersRef = useRef(layers);
  const comparingRef = useRef(comparing);
  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);
  useEffect(() => {
    comparingRef.current = comparing;
  }, [comparing]);

  const [, setState] = useState<FaceState>("loading");
  const setFaceState = useCallback(
    (next: FaceState) => {
      setState((prev) => {
        if (prev !== next) onFaceState?.(next);
        return next;
      });
    },
    [onFaceState],
  );

  useImperativeHandle(handleRef, () => ({
    snapshot() {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL("image/png");
    },
  }));

  useEffect(() => {
    if (!source) return;

    let cancelled = false;
    const canvas = canvasRef.current;
    // Captured now: by cleanup time the ref may already point elsewhere.
    const video = videoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    rendererRef.current ??= new MakeupRenderer();
    smootherRef.current.reset();
    lastLandmarksRef.current = null;
    setFaceState("loading");

    const paint = (
      media: CanvasImageSource,
      width: number,
      height: number,
      landmarks: { x: number; y: number }[] | null,
      mirrored: boolean,
    ) => {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (mirrored) {
        // Mirror the selfie view so moving left moves left on screen. The
        // landmarks are mirrored with it, so makeup still lands correctly.
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(media, 0, 0, width, height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (!landmarks || comparingRef.current || layersRef.current.length === 0) return;

      const points = mirrored ? landmarks.map((p) => ({ x: 1 - p.x, y: p.y })) : landmarks;
      rendererRef.current?.render(ctx, points, width, height, layersRef.current);
    };

    async function runImage(url: string, mirrored: boolean) {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = url;
      try {
        await image.decode();
      } catch {
        if (!cancelled) setFaceState("error");
        return;
      }
      if (cancelled) return;

      let landmarks: { x: number; y: number }[] | null = null;
      try {
        const landmarker = await loadFaceLandmarker();
        if (cancelled) return;
        landmarker.setOptions({ runningMode: "IMAGE" });
        const result = landmarker.detect(image);
        landmarks = result.faceLandmarks?.[0] ?? null;
      } catch {
        if (!cancelled) setFaceState("error");
        return;
      }

      if (cancelled) return;
      lastLandmarksRef.current = landmarks;
      setFaceState(landmarks ? "tracking" : "searching");

      // A still image only needs redrawing when the layers or compare state change.
      const draw = () => {
        if (cancelled) return;
        paint(image, image.naturalWidth, image.naturalHeight, lastLandmarksRef.current, mirrored);
        frameRef.current = requestAnimationFrame(draw);
      };
      draw();
    }

    async function runCamera(stream: MediaStream) {
      if (!video) return;

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      try {
        await video.play();
      } catch {
        if (!cancelled) setFaceState("error");
        return;
      }

      let landmarker;
      try {
        landmarker = await loadFaceLandmarker();
        if (cancelled) return;
        landmarker.setOptions({ runningMode: "VIDEO" });
      } catch {
        if (!cancelled) setFaceState("error");
        return;
      }

      let lastVideoTime = -1;
      setFaceState("searching");

      const loop = () => {
        if (cancelled) return;

        // Stop burning CPU and battery while the tab is in the background.
        if (document.hidden) {
          frameRef.current = requestAnimationFrame(loop);
          return;
        }

        const width = video.videoWidth;
        const height = video.videoHeight;

        if (width && height && video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const now = performance.now();
          try {
            const result = landmarker.detectForVideo(video, now);
            const raw = result.faceLandmarks?.[0] ?? null;
            if (raw) {
              lastLandmarksRef.current = smootherRef.current.smooth(raw, now);
              setFaceState("tracking");
            } else {
              smootherRef.current.reset();
              lastLandmarksRef.current = null;
              setFaceState("searching");
            }
          } catch {
            // A dropped frame is not worth tearing the session down for.
          }
        }

        if (width && height) {
          paint(video, width, height, lastLandmarksRef.current, true);
        }
        frameRef.current = requestAnimationFrame(loop);
      };
      loop();
    }

    if (source.kind === "camera") {
      void runCamera(source.stream);
    } else {
      void runImage(source.url, source.mirrored ?? false);
    }

    return () => {
      cancelled = true;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      if (video) {
        video.pause();
        // Detaching the stream here is what guarantees the camera light goes
        // out the moment the studio is left.
        video.srcObject = null;
      }
    };
  }, [source, setFaceState]);

  // Free the model when the studio unmounts.
  useEffect(() => () => releaseFaceLandmarker(), []);

  return (
    <div className={`relative ${className}`}>
      {/* Never displayed: the frame the user sees is the canvas. */}
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas
        ref={canvasRef}
        className="h-full w-full bg-canvas-soft object-contain"
        aria-label="Virtual try-on preview"
      />
    </div>
  );
}
