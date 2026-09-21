import type { FaceLandmarker } from "@mediapipe/tasks-vision";

/**
 * Loads the Face Landmarker once per page and hands the same instance to every
 * caller. The model and WASM are served from our own origin (see
 * scripts/setup-mediapipe.mjs), so opening the studio makes no third-party
 * request — nothing about a visitor's face is observable to anyone else.
 */
let pending: Promise<FaceLandmarker> | null = null;
let instance: FaceLandmarker | null = null;

export const MODEL_PATH = "/mediapipe/face_landmarker.task";
export const WASM_PATH = "/mediapipe/wasm";

export function loadFaceLandmarker(): Promise<FaceLandmarker> {
  if (instance) return Promise.resolve(instance);
  if (pending) return pending;

  pending = (async () => {
    // Imported here rather than at module scope so the ~3MB bundle only loads
    // on try-on views, never on the rest of the site.
    const { FaceLandmarker: Landmarker, FilesetResolver } = await import(
      "@mediapipe/tasks-vision"
    );

    const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);

    const created = await Landmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_PATH, delegate: "GPU" },
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });

    instance = created;
    return created;
  })();

  pending.catch(() => {
    // Let a failed load be retried rather than cached forever.
    pending = null;
  });

  return pending;
}

/** Frees the model. Called when the studio unmounts. */
export function releaseFaceLandmarker() {
  instance?.close();
  instance = null;
  pending = null;
}
