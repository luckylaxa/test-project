/**
 * One Euro filter.
 *
 * Raw landmarks jitter by a pixel or two every frame even on a still face,
 * which makes a lip line shimmer. A plain low-pass fixes the shimmer but adds
 * lag whenever the head moves. One Euro adapts: heavy smoothing while still,
 * almost none while moving, so colour stays locked without feeling delayed.
 *
 * https://gery.casiez.net/1euro/
 */
class LowPass {
  private value: number | null = null;

  filter(input: number, alpha: number): number {
    this.value = this.value === null ? input : alpha * input + (1 - alpha) * this.value;
    return this.value;
  }

  get last(): number | null {
    return this.value;
  }

  reset() {
    this.value = null;
  }
}

class OneEuro {
  private x = new LowPass();
  private dx = new LowPass();
  private lastTime: number | null = null;

  constructor(
    private minCutoff = 1.2,
    private beta = 0.012,
    private dCutoff = 1.0,
  ) {}

  private static alpha(cutoff: number, dt: number) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }

  filter(value: number, timestamp: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestamp;
      return this.x.filter(value, 1);
    }

    const dt = Math.max(1e-3, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    const previous = this.x.last ?? value;
    const speed = (value - previous) / dt;
    const smoothedSpeed = this.dx.filter(speed, OneEuro.alpha(this.dCutoff, dt));

    // The faster the point moves, the higher the cutoff, the less we smooth.
    const cutoff = this.minCutoff + this.beta * Math.abs(smoothedSpeed);
    return this.x.filter(value, OneEuro.alpha(cutoff, dt));
  }

  reset() {
    this.x.reset();
    this.dx.reset();
    this.lastTime = null;
  }
}

export type Landmark = { x: number; y: number; z?: number };

/** Smooths a whole landmark set, one filter per coordinate. */
export class LandmarkSmoother {
  private filters: OneEuro[] = [];

  constructor(
    private minCutoff = 1.2,
    private beta = 0.012,
  ) {}

  smooth(landmarks: Landmark[], timestamp: number): Landmark[] {
    const needed = landmarks.length * 2;
    if (this.filters.length !== needed) {
      this.filters = Array.from(
        { length: needed },
        () => new OneEuro(this.minCutoff, this.beta),
      );
    }

    return landmarks.map((point, i) => ({
      x: this.filters[i * 2].filter(point.x, timestamp),
      y: this.filters[i * 2 + 1].filter(point.y, timestamp),
      z: point.z,
    }));
  }

  /** Call when the face is lost or the source changes, so the next frame snaps. */
  reset() {
    for (const filter of this.filters) filter.reset();
  }
}
