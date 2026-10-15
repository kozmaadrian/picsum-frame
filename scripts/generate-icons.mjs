import zlib from "node:zlib";
import fs from "node:fs";
// Generates the toolbar icons (artboard frame + redline) as PNGs with no dependencies.
// Usage: npm run icons [-- <output dir>]   (defaults to assets/icons)
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.resolve(process.argv[2] ?? path.join(root, "assets/icons"));
fs.mkdirSync(out, { recursive: true });
const crcT = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
function png(size, px) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; for (let x = 0; x < size; x++) { const [r, g, b, a] = px(x + 0.5, y + 0.5); const o = y * (size * 4 + 1) + 1 + x * 4; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
// coverage via 4x4 supersampling over a unit-space shape function
function render(size, shape) {
  return png(size, (x, y) => {
    let acc = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const c = shape((x - 0.5 + (i + 0.5) / 4) / size, (y - 0.5 + (j + 0.5) / 4) / size);
      if (c) { acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]; acc[3] += 255; }
    }
    const a = acc[3] / 16; if (!a) return [0, 0, 0, 0];
    return [acc[0] * 255 / acc[3], acc[1] * 255 / acc[3], acc[2] * 255 / acc[3], a].map(Math.round);
  });
}
const bg = [0x1d, 0x1e, 0x20], photo = [0xd8, 0xd6, 0xcf], sky = [0x8e, 0xa3, 0xb0], hill = [0x4f, 0x63, 0x55], red = [0xff, 0x5b, 0x45];
const inRound = (x, y, x0, y0, x1, y1, r) => { if (x < x0 || x > x1 || y < y0 || y > y1) return false; const cx = Math.min(Math.max(x, x0 + r), x1 - r), cy = Math.min(Math.max(y, y0 + r), y1 - r); return (x - cx) ** 2 + (y - cy) ** 2 <= r * r; };
function shape(small) {
  return (x, y) => {
    if (!inRound(x, y, 0, 0, 1, 1, 0.2)) return null;
    // artboard (16:10-ish photo)
    const fx0 = 0.16, fy0 = 0.2, fx1 = 0.84, fy1 = 0.64;
    if (x >= fx0 && x <= fx1 && y >= fy0 && y <= fy1) {
      const hy = 0.5 + 0.06 * Math.sin((x - fx0) * 9);
      if (!small && (x - 0.66) ** 2 + (y - 0.32) ** 2 < 0.0036) return photo;
      return y > hy ? hill : sky;
    }
    // width redline under the artboard
    const ly = 0.76, t = small ? 0.05 : 0.028;
    if (Math.abs(y - ly) <= t && x >= fx0 && x <= fx1) return red;
    if (Math.abs(y - ly) <= (small ? 0.1 : 0.07) && (Math.abs(x - fx0) <= t || Math.abs(x - fx1) <= t)) return red;
    return bg;
  };
}
for (const s of [16, 32, 48, 128]) fs.writeFileSync(`${out}/icon-${s}.png`, render(s, shape(s <= 32)));
