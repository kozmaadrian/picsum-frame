import assert from "node:assert/strict";
import { test } from "node:test";

import { MAX_SIZE } from "../src/lib/picsum.js";
import { PRESETS, findPreset, isValidDimension, ratioLabel, sizeForTier, tierOf } from "../src/lib/ratios.js";

test("every preset's sizes share one ratio", () => {
  for (const preset of PRESETS) {
    for (const [w, h] of preset.sizes) {
      assert.equal(findPreset(w, h), preset, `${preset.name} ${w}×${h}`);
      assert.ok(isValidDimension(w) && isValidDimension(h));
    }
  }
});

test("sizeForTier uses preset sizes for preset ratios", () => {
  assert.deepEqual(sizeForTier("s", 1280, 720), [640, 360]);
  assert.deepEqual(sizeForTier("l", 1200, 630), [2400, 1260]);
  assert.deepEqual(sizeForTier("m", 2160, 3840), [1080, 1920]);
});

test("sizeForTier scales custom ratios by long edge and stays under the max", () => {
  assert.deepEqual(sizeForTier("m", 500, 100), [1280, 256]);
  assert.deepEqual(sizeForTier("s", 100, 500), [128, 640]);
  const [w, h] = sizeForTier("l", 5000, 1);
  assert.ok(w <= MAX_SIZE && h >= 1);
});

test("tierOf matches tiers within a pixel, else null", () => {
  assert.equal(tierOf(1280, 720), "m");
  assert.equal(tierOf(1920, 1080), "l");
  assert.equal(tierOf(1281, 720), "m");
  assert.equal(tierOf(1300, 731), null);
  assert.equal(tierOf(1280, 256), "m");
});

test("ratioLabel prefers preset labels, then reduced fractions, then decimals", () => {
  assert.equal(ratioLabel(1200, 630), "1.91:1");
  assert.equal(ratioLabel(500, 100), "5:1");
  assert.equal(ratioLabel(1850, 1000), "1.85:1");
  assert.equal(ratioLabel(1000, 1850), "1:1.85");
});

test("isValidDimension", () => {
  assert.ok(isValidDimension(1));
  assert.ok(isValidDimension(MAX_SIZE));
  for (const bad of [0, -1, MAX_SIZE + 1, 1.5, NaN, "10"]) assert.equal(isValidDimension(bad), false);
});
