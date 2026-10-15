import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_SETTINGS, normalizeSettings } from "../src/lib/settings.js";
import { createStore } from "../src/popup/store.js";

test("normalizeSettings falls back to defaults for missing or bad data", () => {
  assert.deepEqual(normalizeSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(
    normalizeSettings({ w: 0, h: 99999, tier: "xl", blur: 42, format: "gif", id: "../x", lock: "yes" }),
    DEFAULT_SETTINGS,
  );
});

test("normalizeSettings keeps valid data and derives a missing ratio", () => {
  const settings = normalizeSettings({ w: 1080, h: 1350, tier: "l", blur: 3, format: "webp", id: "12", lock: false });
  assert.equal(settings.ratio, 1080 / 1350);
  assert.equal(settings.tier, "l");
  assert.equal(settings.format, "webp");
  assert.equal(settings.id, "12");
  assert.equal(settings.lock, false);
});

test("store.watch fires on change only, comparing arrays by item", () => {
  const store = createStore({ a: 1, b: { x: 1 } });
  const seen = [];
  store.watch((s) => [s.a], ([a]) => seen.push(a));
  store.set({ b: { x: 2 } });
  store.set({ a: 1 });
  store.set((s) => ({ a: s.a + 1 }));
  assert.deepEqual(seen, [1, 2]);
});
