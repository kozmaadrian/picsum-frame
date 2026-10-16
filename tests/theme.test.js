import assert from "node:assert/strict";
import { test } from "node:test";

import { THEME_STORAGE_KEY, applyTheme, currentTheme, nextTheme } from "../src/lib/theme.js";

function fakeEnv() {
  const data = new Map();
  return {
    root: { dataset: {} },
    storage: {
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => data.set(k, String(v)),
      removeItem: (k) => data.delete(k),
    },
  };
}

test("nextTheme cycles system → light → dark → system", () => {
  assert.equal(nextTheme("system"), "light");
  assert.equal(nextTheme("light"), "dark");
  assert.equal(nextTheme("dark"), "system");
});

test("applyTheme forces light/dark on the root and persists; system clears both", () => {
  const env = fakeEnv();
  applyTheme("dark", env);
  assert.equal(env.root.dataset.theme, "dark");
  assert.equal(env.storage.getItem(THEME_STORAGE_KEY), "dark");
  assert.equal(currentTheme(env.root), "dark");

  applyTheme("system", env);
  assert.equal(env.root.dataset.theme, undefined);
  assert.equal(env.storage.getItem(THEME_STORAGE_KEY), null);
  assert.equal(currentTheme(env.root), "system");
});

test("currentTheme ignores unknown values", () => {
  assert.equal(currentTheme({ dataset: { theme: "sepia" } }), "system");
});
