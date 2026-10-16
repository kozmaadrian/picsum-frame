// Aspect-ratio presets and Small / Medium / Large size tiers.

import { MAX_SIZE } from "./picsum.js";

export const TIERS = Object.freeze(["s", "m", "l"]);

export const TIER_NAMES = Object.freeze({ s: "Small", m: "Medium", l: "Large" });

/** Long edge per tier for ratios that aren't presets. */
const TIER_LONG_EDGE = Object.freeze({ s: 640, m: 1280, l: 2560 });

/** Two sizes count as the same ratio within this tolerance (absorbs pixel rounding). */
const RATIO_TOLERANCE = 0.004;

const definePreset = (label, name, sizes) =>
  Object.freeze({ label, name, sizes, ratio: sizes[1][0] / sizes[1][1] });

/** Presets tuned for web/UI mockups. `sizes` are [w, h] for Small, Medium, Large. */
export const PRESETS = Object.freeze([
  definePreset("16:9", "Hero", [[640, 360], [1280, 720], [1920, 1080]]),
  definePreset("1.91:1", "OG card", [[600, 315], [1200, 630], [2400, 1260]]),
  definePreset("21:9", "Banner", [[840, 360], [1680, 720], [2520, 1080]]),
  definePreset("3:1", "Header", [[900, 300], [1500, 500], [3000, 1000]]),
  definePreset("3:2", "Photo", [[600, 400], [1200, 800], [2400, 1600]]),
  definePreset("4:3", "Card", [[640, 480], [1200, 900], [2048, 1536]]),
  definePreset("1:1", "Square", [[400, 400], [1080, 1080], [2048, 2048]]),
  definePreset("4:5", "Portrait", [[640, 800], [1080, 1350], [2160, 2700]]),
  definePreset("2:3", "Tall", [[600, 900], [1000, 1500], [2000, 3000]]),
  definePreset("9:16", "Mobile", [[360, 640], [1080, 1920], [2160, 3840]]),
]);

export const isValidDimension = (n) => Number.isInteger(n) && n >= 1 && n <= MAX_SIZE;

export function findPreset(w, h) {
  return PRESETS.find((p) => Math.abs(p.ratio - w / h) < RATIO_TOLERANCE) ?? null;
}

export function presetSize(preset, tier) {
  return preset.sizes[TIERS.indexOf(tier)];
}

/** [w, h] for `tier` at the ratio of w×h: the preset's size, or scaled by long edge. */
export function sizeForTier(tier, w, h) {
  const preset = findPreset(w, h);
  if (preset) return presetSize(preset, tier);

  const ratio = w / h;
  const long = TIER_LONG_EDGE[tier];
  const size = ratio >= 1 ? [long, long / ratio] : [long * ratio, long];
  const fit = Math.min(1, MAX_SIZE / Math.max(...size));
  return size.map((n) => Math.max(1, Math.round(n * fit)));
}

/** The tier w×h corresponds to, or null for a custom size. */
export function tierOf(w, h) {
  return (
    TIERS.find((tier) => {
      const [tw, th] = sizeForTier(tier, w, h);
      return Math.abs(tw - w) <= 1 && Math.abs(th - h) <= 1;
    }) ?? null
  );
}

/**
 * [w, h, ratio] flipped to the other orientation. A tier size stays on its tier (16:9 Medium →
 * 9:16 Medium), since flipped presets don't always share sizes; a custom size is swapped exactly.
 * Pass the exact `ratio` when known: rounded pixels alone can drift off a preset (213×640 ≠ 1:3).
 */
export function swapOrientation(w, h, ratio = w / h) {
  const flipped = 1 / ratio;
  const tier = tierOf(w, h);
  return tier ? [...sizeForTier(tier, flipped, 1), flipped] : [h, w, flipped];
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/** "16:9" for presets, a reduced fraction for simple ratios, else "1.85:1". */
export function ratioLabel(w, h) {
  const preset = findPreset(w, h);
  if (preset) return preset.label;
  const d = gcd(w, h);
  if (w / d <= 32 && h / d <= 32) return `${w / d}:${h / d}`;
  return w >= h ? `${(w / h).toFixed(2)}:1` : `1:${(h / w).toFixed(2)}`;
}
