"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CanvasStage, type FaceState, type StageHandle, type StageSource } from "./canvas-stage";
import { PermissionScreen, SourceSwitcher, type SourceMode } from "./source-panel";
import { ProductPanel, WearingNow, type Applied } from "./product-panel";
import { MobileControls } from "./mobile-controls";
import type { LookWithItems, ProductWithShades, ShadeRow, TryOnModelRow } from "@/lib/content";
import type { Category, MakeupLayer } from "@/lib/try-on/makeup-renderer";

export type StudioLabels = {
  permissionTitle: string | null;
  permissionBody: string | null;
  disclaimer: string | null;
  startCamera: string;
  upload: string;
  models: string;
  cameraDenied: string;
  looks: string;
  viewProduct: string;
  tryLook: string;
  empty: string;
  none: string;
  clear: string;
  intensity: string;
  compare: string;
  snapshot: string;
  searching: string;
  loading: string;
  error: string;
  products: string;
  close: string;
  canvasLabel: string;
  shopTitle: string;
  addToBasket: string;
  addAll: string;
  save: string;
  saved: string;
};

/**
 * The try-on studio.
 *
 * Camera frames, uploaded photos and every pixel of the result stay inside this
 * tab. Nothing is sent anywhere, and the stream is stopped whenever the source
 * changes or the page is left.
 */
export function Studio({
  products,
  looks,
  models,
  categories,
  labels,
}: {
  products: ProductWithShades[];
  looks: LookWithItems[];
  models: TryOnModelRow[];
  categories: { value: Category; label: string }[];
  labels: StudioLabels;
}) {
  const params = useSearchParams();

  // ?product=&shade= and ?look= let product pages and look cards open the studio
  // with a selection already made. Resolved once, as initial state, so the first
  // paint is already correct rather than flashing empty then filling in.
  const [initial] = useState(() => resolveDeepLink(params, products, looks));

  const [source, setSource] = useState<StageSource | null>(null);
  const [mode, setMode] = useState<SourceMode | null>(null);
  const [denied, setDenied] = useState(false);
  const [faceState, setFaceState] = useState<FaceState>("loading");
  const [applied, setApplied] = useState<Applied[]>(initial.applied);
  const [activeCategory, setActiveCategory] = useState<Category | "looks">(
    initial.category ?? categories[0]?.value ?? "lips",
  );
  const [comparing, setComparing] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const stageRef = useRef<StageHandle | null>(null);

  /** Releases the camera and any object URL. Called before every source swap. */
  const releaseSource = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // Stop the camera when the studio is left, whatever the reason.
  useEffect(() => releaseSource, [releaseSource]);

  const startCamera = useCallback(async () => {
    releaseSource();
    setDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setSource({ kind: "camera", stream });
      setMode("camera");
    } catch {
      setDenied(true);
      setMode(null);
      setSource(null);
    }
  }, [releaseSource]);

  const pickUpload = useCallback(
    (file: File) => {
      releaseSource();
      // A blob URL never leaves the browser; the file is not read by anything else.
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setSource({ kind: "image", url });
      setMode("upload");
    },
    [releaseSource],
  );

  const pickModel = useCallback(
    (model: TryOnModelRow) => {
      if (!model.photo_url) return;
      releaseSource();
      setSource({ kind: "image", url: model.photo_url });
      setMode("model");
    },
    [releaseSource],
  );

  // --- applying shades -----------------------------------------------------

  const applyShade = useCallback(
    (product: ProductWithShades, shade: ShadeRow, intensity?: number) => {
      setApplied((current) => {
        const withoutSame = current.filter((item) => item.product.id !== product.id);
        const alreadyOn = current.some((item) => item.shade.id === shade.id);
        // Tapping the shade that is already on removes it; tapping a different
        // shade of the same product replaces it, as a real product would.
        if (alreadyOn) return withoutSame;
        return [
          ...withoutSame,
          { product, shade, intensity: intensity ?? Number(shade.default_intensity) },
        ];
      });
    },
    [],
  );

  const applyLook = useCallback((look: LookWithItems) => {
    setApplied(
      look.items.map((item) => ({
        shade: item.shade,
        product: item.product as ProductWithShades,
        intensity: Number(item.intensity ?? item.shade.default_intensity),
      })),
    );
  }, []);

  const layers: MakeupLayer[] = useMemo(
    () =>
      applied.map((item) => ({
        category: item.product.category as Category,
        hex: item.shade.hex,
        finish: item.shade.finish,
        intensity: item.intensity,
      })),
    [applied],
  );

  const visibleProducts = useMemo(
    () => products.filter((p) => p.category === activeCategory),
    [products, activeCategory],
  );

  const takeSnapshot = useCallback(() => {
    const data = stageRef.current?.snapshot();
    if (!data) return;
    const link = document.createElement("a");
    link.href = data;
    link.download = "velmora-try-on.png";
    link.click();
  }, []);

  const hasSource = source !== null;

  const statusText =
    faceState === "loading"
      ? labels.loading
      : faceState === "searching"
        ? labels.searching
        : faceState === "error"
          ? labels.error
          : null;

  const panel = (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <ProductPanel
          categories={categories}
          activeCategory={activeCategory}
          onCategory={setActiveCategory}
          products={visibleProducts}
          looks={looks}
          applied={applied}
          onToggleShade={applyShade}
          onApplyLook={applyLook}
          labels={{
            looks: labels.looks,
            viewProduct: labels.viewProduct,
            tryLook: labels.tryLook,
            empty: labels.empty,
          }}
        />
      </div>
      {/* Bounded and scrollable: with five products applied the sliders used to
          run past the panel and collide with the disclaimer beneath it. */}
      <div className="mt-5 max-h-[38%] shrink-0 overflow-y-auto border-t border-line pt-4">
        <WearingNow
          applied={applied}
          onRemove={(id) => setApplied((c) => c.filter((i) => i.shade.id !== id))}
          onIntensity={(id, value) =>
            setApplied((c) => c.map((i) => (i.shade.id === id ? { ...i, intensity: value } : i)))
          }
          onClear={() => setApplied([])}
          labels={{
            none: labels.none,
            clear: labels.clear,
            intensity: labels.intensity,
            title: labels.shopTitle,
            add: labels.addToBasket,
            addAll: labels.addAll,
            save: labels.save,
            saved: labels.saved,
          }}
        />
      </div>
    </>
  );

  return (
    // A full-screen surface on a phone too. It used to be a tall scrolling page
    // whose stage was `min-h-[58svh]`, which left the camera in a letterboxed
    // strip with a screenful of dead ivory under it — and pushed the only way
    // into the shades to the very bottom, where iOS Safari's own toolbar covers
    // it. `dvh` is the unit that accounts for that toolbar.
    <div className="flex h-[calc(100dvh-5rem)] flex-col overflow-hidden lg:grid lg:h-[calc(100dvh-6rem)] lg:grid-cols-[1fr_24rem] lg:overflow-visible">
      {/* Stage */}
      <div className="relative flex min-h-0 flex-1 flex-col bg-ink lg:bg-canvas-soft">
        <div className="relative min-h-0 flex-1">
          {hasSource ? (
            <div className="absolute inset-0">
              <CanvasStage
                source={source}
                layers={layers}
                comparing={comparing}
                onFaceState={setFaceState}
                handleRef={stageRef}
                canvasLabel={labels.canvasLabel}
                className="h-full w-full"
              />
            </div>
          ) : (
            <PermissionScreen
              title={labels.permissionTitle}
              body={labels.permissionBody}
              startLabel={labels.startCamera}
              uploadLabel={labels.upload}
              modelLabel={labels.models}
              models={models}
              denied={denied}
              deniedMessage={labels.cameraDenied}
              onStartCamera={startCamera}
              onUpload={pickUpload}
              onPickModel={pickModel}
            />
          )}

          {/* Phone controls float over the foot of the stage. Every panel we
              tried under it covered the mouth. */}
          {hasSource ? (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-ink/60 to-transparent px-[var(--gutter)] pt-3 pb-8 lg:hidden">
                <div className="pointer-events-auto flex items-center justify-between gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <SourceSwitcher
                    mode={mode}
                    models={models}
                    tone="over"
                    labels={{ camera: labels.startCamera, upload: labels.upload, models: labels.models }}
                    onStartCamera={startCamera}
                    onUpload={pickUpload}
                    onPickModel={pickModel}
                  />
                  <span className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onPointerDown={() => setComparing(true)}
                      onPointerUp={() => setComparing(false)}
                      onPointerLeave={() => setComparing(false)}
                      disabled={applied.length === 0}
                      className="rounded-full bg-canvas/20 px-3.5 py-2 text-[0.5625rem] tracking-[0.16em] whitespace-nowrap text-canvas uppercase disabled:opacity-40"
                    >
                      {labels.compare}
                    </button>
                    <button
                      type="button"
                      onClick={takeSnapshot}
                      className="rounded-full bg-canvas/20 px-3.5 py-2 text-[0.5625rem] tracking-[0.16em] whitespace-nowrap text-canvas uppercase"
                    >
                      {labels.snapshot}
                    </button>
                  </span>
                </div>
              </div>

              <MobileControls
                categories={categories}
                activeCategory={activeCategory}
                onCategory={setActiveCategory}
                products={visibleProducts}
                looks={looks}
                applied={applied}
                onToggleShade={applyShade}
                onApplyLook={applyLook}
                onClear={() => setApplied([])}
                labels={{
                  looks: labels.looks,
                  addToBasket: labels.addToBasket,
                  addAll: labels.addAll,
                  viewProduct: labels.viewProduct,
                  clear: labels.clear,
                  save: labels.save,
                  saved: labels.saved,
                  empty: labels.empty,
                }}
              />
            </>
          ) : null}

          {hasSource && statusText ? (
            <p
              role="status"
              className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-[0.625rem] tracking-[0.18em] text-ink-muted uppercase"
            >
              {statusText}
            </p>
          ) : null}
        </div>

        {hasSource ? (
          <div className="hidden flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas px-[var(--gutter)] py-3 lg:flex lg:flex-nowrap lg:gap-6">
            <SourceSwitcher
              mode={mode}
              models={models}
              labels={{ camera: labels.startCamera, upload: labels.upload, models: labels.models }}
              onStartCamera={startCamera}
              onUpload={pickUpload}
              onPickModel={pickModel}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                // Press and hold to see the bare face underneath.
                onPointerDown={() => setComparing(true)}
                onPointerUp={() => setComparing(false)}
                onPointerLeave={() => setComparing(false)}
                onKeyDown={(e) => e.key === "Enter" && setComparing(true)}
                onKeyUp={(e) => e.key === "Enter" && setComparing(false)}
                disabled={applied.length === 0}
                className="border border-ink/20 px-4 py-2 text-[0.625rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:border-ink disabled:opacity-40"
              >
                {labels.compare}
              </button>
              <button
                type="button"
                onClick={takeSnapshot}
                className="border border-ink/20 px-4 py-2 text-[0.625rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:border-ink"
              >
                {labels.snapshot}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Desktop panel */}
      <aside className="hidden border-l border-line px-6 py-6 lg:flex lg:min-h-0 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col">{panel}</div>
        {labels.disclaimer ? (
          <p className="mt-5 border-t border-line pt-4 text-[0.6875rem] leading-relaxed text-ink-muted">
            {labels.disclaimer}
          </p>
        ) : null}
      </aside>


    </div>
  );
}

type DeepLink = { applied: Applied[]; category: Category | null };

/** Reads the query string into an initial selection. Returns empty when nothing matches. */
function resolveDeepLink(
  params: URLSearchParams,
  products: ProductWithShades[],
  looks: LookWithItems[],
): DeepLink {
  const lookSlug = params.get("look");
  if (lookSlug) {
    const look = looks.find((l) => l.slug === lookSlug);
    if (look) {
      return {
        applied: look.items.map((item) => ({
          shade: item.shade,
          product: item.product as ProductWithShades,
          intensity: Number(item.intensity ?? item.shade.default_intensity),
        })),
        category: null,
      };
    }
  }

  const productSlug = params.get("product");
  if (!productSlug) return { applied: [], category: null };

  const product = products.find((p) => p.slug === productSlug);
  if (!product) return { applied: [], category: null };

  const shades = (product.shades ?? []).filter((s) => s.is_visible);
  const shade = shades.find((s) => s.id === params.get("shade")) ?? shades[0];
  if (!shade) return { applied: [], category: product.category as Category };

  return {
    applied: [{ product, shade, intensity: Number(shade.default_intensity) }],
    category: product.category as Category,
  };
}
