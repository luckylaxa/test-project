/**
 * Copies the MediaPipe vision WASM runtime out of node_modules into public/.
 *
 * We self-host the runtime and the model rather than loading them from Google's
 * CDN: opening the try-on then makes no third-party request at all, which is
 * what lets us say nothing about a visitor's face leaves their device.
 *
 * The .wasm files are ~23MB, so they are generated here and gitignored instead
 * of being committed. The model (face_landmarker.task) IS committed, so a build
 * never depends on an external download.
 *
 * Runs automatically before `dev` and `build`.
 */
import { copyFile, mkdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
// The package's "exports" map hides package.json, so resolve the entry point
// and walk up from there to find the package root.
const pkgDir = dirname(require.resolve("@mediapipe/tasks-vision"));
const srcDir = join(pkgDir, "wasm");
const outDir = join(process.cwd(), "public", "mediapipe", "wasm");

// SIMD build plus the no-SIMD fallback MediaPipe picks on older devices.
const FILES = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
];

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

await mkdir(outDir, { recursive: true });

let copied = 0;
for (const file of FILES) {
  const from = join(srcDir, file);
  const to = join(outDir, file);

  if (!(await exists(from))) {
    console.error(`[mediapipe] missing ${file} in ${srcDir} — is @mediapipe/tasks-vision installed?`);
    process.exit(1);
  }

  // Skip files already copied at the same size, so repeat builds stay fast.
  const [src, dest] = [await stat(from), (await exists(to)) ? await stat(to) : null];
  if (dest && dest.size === src.size) continue;

  await copyFile(from, to);
  copied += 1;
}

console.log(
  copied > 0
    ? `[mediapipe] copied ${copied} runtime file(s) to public/mediapipe/wasm`
    : "[mediapipe] runtime already up to date",
);
