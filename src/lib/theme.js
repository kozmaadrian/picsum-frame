// Panel color theme: follow the system, or force light or dark.
// Stored in localStorage (not chrome.storage) so theme-boot.js can read it synchronously before
// first paint. Keep the key and values in sync with src/panel/theme-boot.js.

export const THEMES = Object.freeze(["system", "light", "dark"]);

export const THEME_NAMES = Object.freeze({ system: "System", light: "Light", dark: "Dark" });

export const THEME_STORAGE_KEY = "picsum-frame-theme";

export const nextTheme = (theme) => THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];

/** The forced theme on <html>, or "system". */
export function currentTheme(root = document.documentElement) {
  return THEMES.includes(root.dataset.theme) ? root.dataset.theme : "system";
}

export function applyTheme(theme, { root = document.documentElement, storage = globalThis.localStorage } = {}) {
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    if (theme === "system") storage.removeItem(THEME_STORAGE_KEY);
    else storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* best-effort: the panel just follows the system next time */
  }
}
