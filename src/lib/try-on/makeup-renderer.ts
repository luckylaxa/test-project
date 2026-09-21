import {
  BROW_LEFT,
  BROW_RIGHT,
  CHEEK_LEFT,
  CHEEK_RIGHT,
  CHIN,
  EYE_LEFT,
  EYE_RIGHT,
  FACE_LEFT_EDGE,
  FACE_OVAL,
  FACE_RIGHT_EDGE,
  FOREHEAD,
  LASH_LINE_LEFT,
  LASH_LINE_RIGHT,
  LIPS_INNER,
  LIPS_OUTER,
  distance,
  lidRegion,
  point,
  smoothClosedPath,
  taperedBand,
  toPoints,
  type Point,
} from "./face-regions";

export type Finish = "matte" | "satin" | "gloss" | "shimmer" | "natural";
export type Category = "lips" | "cheeks" | "eyes" | "brows" | "face";

export type MakeupLayer = {
  category: Category;
  hex: string;
  finish: Finish;
  /** 0–1, the shade's default intensity as adjusted by the user. */
  intensity: number;
};

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const value = parseInt(
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean,
    16,
  );
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function rgba({ r, g, b }: RGB, a: number) {
  return `rgba(${r},${g},${b},${a})`;
}

/** Perceived lightness, 0–1. Used to adapt blending to pale vs deep shades. */
function luminance({ r, g, b }: RGB): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * The makeup renderer.
 *
 * Each product is painted onto a scratch canvas as a soft-edged mask, then
 * composited onto the photo with blend modes rather than drawn on top of it.
 * That distinction is the whole trick: `color` takes the hue and saturation of
 * the shade while keeping the *luminosity* of the underlying skin, so pores,
 * lip lines and shadows all survive. A flat `source-over` fill would bury them
 * and read instantly as a sticker.
 */
export class MakeupRenderer {
  private scratch: HTMLCanvasElement | OffscreenCanvas;
  private sctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  private noise: HTMLCanvasElement | OffscreenCanvas | null = null;
  private width = 0;
  private height = 0;

  constructor() {
    const { canvas, ctx } = createCanvas(2, 2);
    this.scratch = canvas;
    this.sctx = ctx;
  }

  private ensureSize(width: number, height: number) {
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    this.scratch.width = width;
    this.scratch.height = height;
    this.noise = null;
  }

  /** Clears the scratch canvas and returns its context, ready to paint a mask. */
  private beginLayer() {
    this.sctx.setTransform(1, 0, 0, 1, 0, 0);
    this.sctx.filter = "none";
    this.sctx.globalAlpha = 1;
    this.sctx.globalCompositeOperation = "source-over";
    this.sctx.clearRect(0, 0, this.width, this.height);
    return this.sctx;
  }

  /** Composites the finished mask onto the frame with a blend mode. */
  private compose(
    ctx: CanvasRenderingContext2D,
    mode: GlobalCompositeOperation,
    alpha: number,
  ) {
    if (alpha <= 0.001) return;
    ctx.save();
    ctx.globalCompositeOperation = mode;
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.drawImage(this.scratch as CanvasImageSource, 0, 0);
    ctx.restore();
  }

  /**
   * Paints every layer onto `ctx`, which must already hold the frame.
   * Layers are drawn back to front: skin, then cheeks, eyes, brows, lips.
   */
  render(
    ctx: CanvasRenderingContext2D,
    landmarks: Point[],
    width: number,
    height: number,
    layers: MakeupLayer[],
  ) {
    if (landmarks.length < 468) return;
    this.ensureSize(width, height);

    // Every blur and offset is expressed as a fraction of face width, so the
    // result looks the same whether the face fills the frame or sits far away.
    const faceWidth = distance(
      point(landmarks, FACE_LEFT_EDGE, width, height),
      point(landmarks, FACE_RIGHT_EDGE, width, height),
    );
    const faceHeight = distance(
      point(landmarks, FOREHEAD, width, height),
      point(landmarks, CHIN, width, height),
    );
    const scale = Math.max(faceWidth, faceHeight * 0.75);
    if (scale < 20) return;

    const order: Category[] = ["face", "cheeks", "eyes", "brows", "lips"];
    for (const category of order) {
      for (const layer of layers) {
        if (layer.category !== category || layer.intensity <= 0) continue;
        switch (category) {
          case "face":
            this.renderSkin(ctx, landmarks, width, height, scale, layer);
            break;
          case "cheeks":
            this.renderBlush(ctx, landmarks, width, height, scale, layer);
            break;
          case "eyes":
            this.renderEyes(ctx, landmarks, width, height, scale, layer);
            break;
          case "brows":
            this.renderBrows(ctx, landmarks, width, height, scale, layer);
            break;
          case "lips":
            this.renderLips(ctx, landmarks, width, height, scale, layer);
            break;
        }
      }
    }
  }

  // ---------------------------------------------------------------- lips

  private renderLips(
    ctx: CanvasRenderingContext2D,
    landmarks: Point[],
    w: number,
    h: number,
    scale: number,
    layer: MakeupLayer,
  ) {
    const rgb = hexToRgb(layer.hex);
    const outer = smoothClosedPath(toPoints(landmarks, LIPS_OUTER, w, h));
    const inner = smoothClosedPath(toPoints(landmarks, LIPS_INNER, w, h));

    // The ring between the two lip lines. Painting the inner shape too would
    // colour the teeth whenever the mouth is open.
    const ring = new Path2D();
    ring.addPath(outer);
    ring.addPath(inner);

    const s = this.beginLayer();
    s.filter = `blur(${(scale * 0.006).toFixed(2)}px)`;
    s.fillStyle = rgba(rgb, 1);
    s.fill(ring, "evenodd");
    s.filter = "none";

    const i = layer.intensity;
    const light = luminance(rgb);

    // `color` carries the hue; `multiply` supplies the depth.
    // The curve matters: `color` preserves the backdrop's luminosity, so a deep
    // shade would otherwise render as a pastel version of itself. Weighting
    // multiply by how dark the shade is lets a plum read as plum while a nude
    // stays sheer instead of turning muddy.
    this.compose(ctx, "color", i * 0.9);
    this.compose(ctx, "multiply", i * (0.2 + Math.pow(1 - light, 1.5) * 0.85));

    // Matte reads flat because it scatters light; the others get a highlight.
    if (layer.finish === "matte") return;

    const lipPoints = toPoints(landmarks, LIPS_OUTER, w, h);
    const innerPoints = toPoints(landmarks, LIPS_INNER, w, h);
    const centre = innerPoints.reduce(
      (acc, p) => ({ x: acc.x + p.x / innerPoints.length, y: acc.y + p.y / innerPoints.length }),
      { x: 0, y: 0 },
    );
    const lipWidth = distance(lipPoints[0], lipPoints[10]);
    const lowerLip = { x: centre.x, y: centre.y + lipWidth * 0.14 };

    // A gloss is a tight wet catchlight, not a wash. Too wide or too opaque and
    // the lip reads bleached rather than shiny.
    const strength =
      layer.finish === "gloss" ? 0.52 : layer.finish === "shimmer" ? 0.34 : 0.2;
    const spread = layer.finish === "gloss" ? 0.22 : 0.4;

    const g = this.beginLayer();
    g.save();
    g.clip(ring, "evenodd");
    const gradient = g.createRadialGradient(
      lowerLip.x,
      lowerLip.y,
      0,
      lowerLip.x,
      lowerLip.y,
      lipWidth * spread,
    );
    gradient.addColorStop(0, `rgba(255,255,255,${strength})`);
    gradient.addColorStop(0.34, `rgba(255,255,255,${strength * 0.22})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    g.filter = `blur(${(scale * 0.01).toFixed(2)}px)`;
    g.fillStyle = gradient;
    g.fillRect(0, 0, w, h);
    g.restore();
    g.filter = "none";

    this.compose(ctx, "screen", layer.finish === "gloss" ? Math.min(1, i * 1.1) : i * 0.9);

    if (layer.finish === "gloss") {
      const upper = { x: centre.x, y: centre.y - lipWidth * 0.1 };
      const u = this.beginLayer();
      u.save();
      u.clip(ring, "evenodd");
      const sheen = u.createRadialGradient(upper.x, upper.y, 0, upper.x, upper.y, lipWidth * 0.13);
      sheen.addColorStop(0, "rgba(255,255,255,0.3)");
      sheen.addColorStop(1, "rgba(255,255,255,0)");
      u.filter = `blur(${(scale * 0.012).toFixed(2)}px)`;
      u.fillStyle = sheen;
      u.fillRect(0, 0, w, h);
      u.restore();
      u.filter = "none";
      this.compose(ctx, "screen", i * 0.5);
    }

    if (layer.finish === "shimmer") {
      this.renderShimmer(ctx, ring, w, h, scale, i * 0.5);
    }
  }

  // -------------------------------------------------------------- cheeks

  private renderBlush(
    ctx: CanvasRenderingContext2D,
    landmarks: Point[],
    w: number,
    h: number,
    scale: number,
    layer: MakeupLayer,
  ) {
    const rgb = hexToRgb(layer.hex);
    const s = this.beginLayer();
    // A wide blur is what separates blush from a painted circle.
    s.filter = `blur(${(scale * 0.055).toFixed(2)}px)`;

    for (const index of [CHEEK_RIGHT, CHEEK_LEFT]) {
      const c = point(landmarks, index, w, h);
      const radius = scale * 0.2;
      const gradient = s.createRadialGradient(c.x, c.y, 0, c.x, c.y, radius);
      gradient.addColorStop(0, rgba(rgb, 1));
      gradient.addColorStop(0.5, rgba(rgb, 0.55));
      gradient.addColorStop(1, rgba(rgb, 0));
      s.fillStyle = gradient;
      s.beginPath();
      // Slightly wider than tall, following the plane of the cheekbone.
      s.ellipse(c.x, c.y, radius, radius * 0.78, 0, 0, Math.PI * 2);
      s.fill();
    }
    s.filter = "none";

    const i = layer.intensity;
    this.compose(ctx, "color", i * 0.6);
    this.compose(ctx, "multiply", i * 0.3);
    if (layer.finish === "shimmer" || layer.finish === "gloss") {
      this.compose(ctx, "soft-light", i * 0.3);
    }
  }

  // ----------------------------------------------------------------- eyes

  private renderEyes(
    ctx: CanvasRenderingContext2D,
    landmarks: Point[],
    w: number,
    h: number,
    scale: number,
    layer: MakeupLayer,
  ) {
    const rgb = hexToRgb(layer.hex);
    const i = layer.intensity;

    // A very dark, very saturated shade at high intensity is eyeliner; anything
    // softer is shadow. This is how one "eyes" category covers both products
    // without asking the editor to classify them.
    const isLiner = luminance(rgb) < 0.22 && layer.finish === "matte";

    if (isLiner) {
      const s = this.beginLayer();
      s.filter = `blur(${(scale * 0.0028).toFixed(2)}px)`;
      s.fillStyle = rgba(rgb, 1);

      // Thicken away from the centre of the face, so each eye gets a hairline
      // at its inner corner and more weight at the outer.
      const centreX =
        (point(landmarks, 33, w, h).x + point(landmarks, 263, w, h).x) / 2;
      const maxWidth = scale * 0.012;

      for (const lash of [LASH_LINE_RIGHT, LASH_LINE_LEFT]) {
        const pts = toPoints(landmarks, lash, w, h);
        const spans = pts.map((p) => Math.abs(p.x - centreX));
        const near = Math.min(...spans);
        const far = Math.max(...spans);
        const range = Math.max(1, far - near);

        const band = taperedBand(pts, (t, index) => {
          const outward = (spans[index] - near) / range;
          // Taper to nothing at both ends so the line has no blunt edge.
          const ends = Math.sin(Math.PI * t) ** 0.35;
          return maxWidth * (0.3 + 0.7 * outward) * ends;
        });
        s.fill(smoothClosedPath(band, 0.3));
      }
      s.filter = "none";

      // Multiply deepens the lash line; a little real pigment on top keeps the
      // line readable on someone who already has dark lashes.
      this.compose(ctx, "multiply", i * 0.9);
      this.compose(ctx, "source-over", i * 0.38);
      return;
    }

    const s = this.beginLayer();
    s.filter = `blur(${(scale * 0.028).toFixed(2)}px)`;
    s.fillStyle = rgba(rgb, 1);

    for (const [lash, brow] of [
      [LASH_LINE_RIGHT, BROW_RIGHT],
      [LASH_LINE_LEFT, BROW_LEFT],
    ] as const) {
      const region = lidRegion(landmarks, [...lash], [...brow], w, h, 0.55);
      s.fill(smoothClosedPath(region, 0.4));
    }
    s.filter = "none";

    this.compose(ctx, "color", i * 0.8);
    this.compose(ctx, "multiply", i * 0.5);

    if (layer.finish === "shimmer" || layer.finish === "gloss") {
      const lid = new Path2D();
      for (const [lash, brow] of [
        [LASH_LINE_RIGHT, BROW_RIGHT],
        [LASH_LINE_LEFT, BROW_LEFT],
      ] as const) {
        lid.addPath(smoothClosedPath(lidRegion(landmarks, [...lash], [...brow], w, h, 0.4), 0.4));
      }
      this.renderShimmer(ctx, lid, w, h, scale, i * 0.55);
    }
  }

  // ---------------------------------------------------------------- brows

  private renderBrows(
    ctx: CanvasRenderingContext2D,
    landmarks: Point[],
    w: number,
    h: number,
    scale: number,
    layer: MakeupLayer,
  ) {
    const rgb = hexToRgb(layer.hex);
    const s = this.beginLayer();
    s.filter = `blur(${(scale * 0.009).toFixed(2)}px)`;
    s.fillStyle = rgba(rgb, 1);
    for (const brow of [BROW_RIGHT, BROW_LEFT]) {
      s.fill(smoothClosedPath(toPoints(landmarks, brow, w, h), 0.35));
    }
    s.filter = "none";

    // Multiply only: a brow tint colours the hairs, it does not fill the gaps
    // between them. Any `source-over` here would paint a solid block.
    this.compose(ctx, "multiply", layer.intensity * 0.55);
    this.compose(ctx, "color", layer.intensity * 0.45);
  }

  // ----------------------------------------------------------------- face

  private renderSkin(
    ctx: CanvasRenderingContext2D,
    landmarks: Point[],
    w: number,
    h: number,
    scale: number,
    layer: MakeupLayer,
  ) {
    const rgb = hexToRgb(layer.hex);
    const s = this.beginLayer();
    s.filter = `blur(${(scale * 0.03).toFixed(2)}px)`;
    s.fillStyle = rgba(rgb, 1);

    const oval = smoothClosedPath(toPoints(landmarks, FACE_OVAL, w, h), 0.4);
    const mask = new Path2D();
    mask.addPath(oval);
    // Cut the eyes and lips back out so a skin tint never dulls them.
    mask.addPath(smoothClosedPath(toPoints(landmarks, EYE_RIGHT, w, h), 0.4));
    mask.addPath(smoothClosedPath(toPoints(landmarks, EYE_LEFT, w, h), 0.4));
    mask.addPath(smoothClosedPath(toPoints(landmarks, LIPS_OUTER, w, h)));
    s.fill(mask, "evenodd");
    s.filter = "none";

    // Deliberately weak. A skin tint evens tone; it must not flatten texture,
    // so `soft-light` does most of the work and `color` only nudges the hue.
    const i = layer.intensity;
    this.compose(ctx, "soft-light", i * 0.85);
    this.compose(ctx, "color", i * 0.35);
  }

  // -------------------------------------------------------------- shimmer

  /** Fine sparkle, masked to a region and screened on. */
  private renderShimmer(
    ctx: CanvasRenderingContext2D,
    region: Path2D,
    w: number,
    h: number,
    scale: number,
    alpha: number,
  ) {
    if (!this.noise) this.noise = buildNoise(Math.max(64, Math.round(scale)));

    const s = this.beginLayer();
    s.save();
    s.clip(region, "evenodd");
    const pattern = s.createPattern(this.noise as CanvasImageSource, "repeat");
    if (pattern) {
      s.fillStyle = pattern;
      s.filter = `blur(${(scale * 0.002).toFixed(2)}px)`;
      s.fillRect(0, 0, w, h);
    }
    s.restore();
    s.filter = "none";

    this.compose(ctx, "screen", alpha);
  }
}

function createCanvas(width: number, height: number) {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (ctx) return { canvas, ctx: ctx as OffscreenCanvasRenderingContext2D };
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available in this browser.");
  return { canvas, ctx };
}

/** A small tile of sparse bright specks, tiled to make shimmer. */
function buildNoise(size: number) {
  const { canvas, ctx } = createCanvas(size, size);
  const image = ctx.createImageData(size, size);
  for (let p = 0; p < size * size; p += 1) {
    // Sparse: most pixels stay black so `screen` leaves the skin alone.
    const hit = Math.random() > 0.93 ? Math.random() * 255 : 0;
    image.data[p * 4] = hit;
    image.data[p * 4 + 1] = hit;
    image.data[p * 4 + 2] = hit;
    image.data[p * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}
