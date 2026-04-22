/**
 * Rimuove sfondo piatto da un PNG (campiona i bordi) → `public/brand/risk-sent-r.png`.
 * Copia un nuovo sorgente con sfondo piatto e:
 *   node scripts/risk-logo-chroma.mjs path/verso/sorgente.png
 */
import sharp from "sharp";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const defaultSrc = join(root, "public/brand/risk-sent-r-source.png");
const outPath = join(root, "public/brand/risk-sent-r.png");
const input = resolve(root, process.argv[2] || defaultSrc);

if (!existsSync(input)) {
  console.error("File non trovato:", input);
  console.error("Uso: node scripts/risk-logo-chroma.mjs [sorgente.png]");
  process.exit(1);
}

const TOL = 38;
const edgeSoft = 12;

const buf = await readFile(input);
const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width;
const h = info.height;
const n = w * h;

function sampleAt(px, py) {
  const i = (py * w + px) * 4;
  return [data[i], data[i + 1], data[i + 2]];
}

const cornerSamples = [
  sampleAt(0, 0),
  sampleAt(w - 1, 0),
  sampleAt(0, h - 1),
  sampleAt(w - 1, h - 1),
  sampleAt(Math.floor(w / 2), 0),
  sampleAt(0, Math.floor(h / 2)),
  sampleAt(w - 1, Math.floor(h / 2)),
  sampleAt(Math.floor(w / 2), h - 1),
];
const bgR = cornerSamples.reduce((a, c) => a + c[0], 0) / cornerSamples.length;
const bgG = cornerSamples.reduce((a, c) => a + c[1], 0) / cornerSamples.length;
const bgB = cornerSamples.reduce((a, c) => a + c[2], 0) / cornerSamples.length;

for (let i = 0; i < n; i++) {
  const o = i * 4;
  const r = data[o];
  const g = data[o + 1];
  const b = data[o + 2];
  const d = Math.hypot(r - bgR, g - bgG, b - bgB);
  if (d <= TOL) {
    data[o + 3] = 0;
  } else if (d < TOL + edgeSoft) {
    const t = (d - TOL) / edgeSoft;
    data[o + 3] = Math.round(data[o + 3] * t);
  }
}

const out = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer();
await writeFile(outPath, out);
console.log(`OK → ${outPath} (${w}×${h}), bg ≈ rgb(${bgR | 0},${bgG | 0},${bgB | 0})`);
