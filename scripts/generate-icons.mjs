// Rasterizes public/icon.svg into the PNG sizes the PWA manifest references.
// Run with: bun run scripts/generate-icons.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public", "icon.svg"));

const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const { file, size } of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .flatten({ background: "#0f766e" })
    .png()
    .toFile(join(root, "public", file));
  console.log(`generated public/${file} (${size}x${size})`);
}
