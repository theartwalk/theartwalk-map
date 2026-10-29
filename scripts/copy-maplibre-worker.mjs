// MapLibre v6 runs map rendering work in a web worker that it loads from a separate file.
// Bundlers don't copy that file, so we serve it from /public and point MapLibre at it.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs");
const outDir = join(root, "public", "maplibre");
mkdirSync(outDir, { recursive: true });
copyFileSync(src, join(outDir, "maplibre-gl-worker.mjs"));
console.log("Copied MapLibre worker to public/maplibre/");
