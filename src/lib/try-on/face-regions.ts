/**
 * Landmark index sets from the MediaPipe canonical 478-point face mesh, and the
 * path maths used to turn them into smooth makeup shapes.
 *
 * Indices are fixed by the model, not chosen by us — they are the same on every
 * face, which is what lets a shape follow head rotation for free.
 */

export type Point = { x: number; y: number };

/** Outer lip line. */
export const LIPS_OUTER = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185,
];

/** Inner lip line — cut out so colour never lands on teeth or the mouth opening. */
export const LIPS_INNER = [
  78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191,
];

/** Upper lash lines, inner corner to outer corner. */
export const LASH_LINE_RIGHT = [33, 246, 161, 160, 159, 158, 157, 173, 133];
export const LASH_LINE_LEFT = [362, 398, 384, 385, 386, 387, 388, 466, 263];

/** Brow outlines. */
export const BROW_RIGHT = [46, 53, 52, 65, 55, 107, 66, 105, 63, 70];
export const BROW_LEFT = [276, 283, 282, 295, 285, 336, 296, 334, 293, 300];

/** Face oval, used for skin tint. */
export const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377,
  152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
];

/** Eye outlines, cut out of the skin tint so lashes and waterline stay clean. */
export const EYE_RIGHT = [
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
];
export const EYE_LEFT = [
  263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466,
];

/** Cheek centres for blush. */
export const CHEEK_RIGHT = 50;
export const CHEEK_LEFT = 280;

/** Face extremes used to scale every blur and offset to the size of the face. */
export const FACE_LEFT_EDGE = 234;
export const FACE_RIGHT_EDGE = 454;
export const FOREHEAD = 10;
export const CHIN = 152;

export function toPoints(landmarks: Point[], indices: number[], w: number, h: number): Point[] {
  return indices.map((i) => ({ x: landmarks[i].x * w, y: landmarks[i].y * h }));
}

export function point(landmarks: Point[], index: number, w: number, h: number): Point {
  return { x: landmarks[index].x * w, y: landmarks[index].y * h };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Closed Catmull-Rom spline as a Path2D.
 *
 * Joining landmarks with straight lines gives a faceted, cartoon-like edge —
 * the single biggest giveaway of fake makeup. Interpolating through them keeps
 * the lip line smooth at any zoom.
 */
export function smoothClosedPath(points: Point[], tension = 0.5): Path2D {
  const path = new Path2D();
  const n = points.length;
  if (n < 3) return path;

  path.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < n; i += 1) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension * 2;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension * 2;

    path.bezierCurveTo(c1x, c1y, c2x, c2y, p2.x, p2.y);
  }

  path.closePath();
  return path;
}

/** Open Catmull-Rom spline, for the lash line. */
export function smoothOpenPath(points: Point[]): Path2D {
  const path = new Path2D();
  const n = points.length;
  if (n < 2) return path;

  path.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < n - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(n - 1, i + 2)];

    path.bezierCurveTo(
      p1.x + (p2.x - p0.x) / 6,
      p1.y + (p2.y - p0.y) / 6,
      p2.x - (p3.x - p1.x) / 6,
      p2.y - (p3.y - p1.y) / 6,
      p2.x,
      p2.y,
    );
  }
  return path;
}

/**
 * Builds the eyeshadow shape: the lash line, then a return sweep lifted toward
 * the brow. The lift is largest over the middle of the lid and tapers at both
 * corners, which is how shadow actually sits on an eye.
 */
export function lidRegion(
  landmarks: Point[],
  lashIndices: number[],
  browIndices: number[],
  w: number,
  h: number,
  reach: number,
): Point[] {
  const lash = toPoints(landmarks, lashIndices, w, h);
  const brow = toPoints(landmarks, browIndices, w, h);

  const browY = brow.reduce((sum, p) => sum + p.y, 0) / brow.length;

  const lifted = lash
    .map((p, i) => {
      const t = i / (lash.length - 1);
      // Bell curve: no lift at the corners, most in the middle of the lid.
      const falloff = Math.sin(Math.PI * t) ** 0.8;
      const ceiling = browY + (p.y - browY) * (1 - reach);
      return { x: p.x, y: p.y + (ceiling - p.y) * falloff };
    })
    .reverse();

  return [...lash, ...lifted];
}

/**
 * Builds a closed band that hugs a line, with a width that varies along it.
 *
 * Eyeliner is not a uniform stroke: it is a hairline at the inner corner and
 * thickens toward the outer, tapering to nothing at both ends. Stroking the
 * lash line with a fixed lineWidth gives the heavy marker look this avoids.
 */
export function taperedBand(points: Point[], widthAt: (t: number, i: number) => number): Point[] {
  const n = points.length;
  if (n < 2) return points;

  const upper = points.map((p, i) => {
    const t = i / (n - 1);
    return { x: p.x, y: p.y - widthAt(t, i) };
  });

  return [...points, ...upper.reverse()];
}
