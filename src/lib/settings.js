// Persisted popup settings: chrome.storage.local in the extension, localStorage as a plain page.

import { FORMATS } from "./picsum.js";
import { TIERS, isValidDimension } from "./ratios.js";

export const DEFAULT_SETTINGS = Object.freeze({
  w: 1280,
  h: 720,
  /** Ratio kept while the lock is on, so repeated edits don't drift from rounding. */
  ratio: 16 / 9,
  lock: true,
  tier: "m",
  grayscale: false,
  blur: 0,
  format: "jpg",
  /** Current Picsum photo id; kept so reopening the popup shows the same photo. */
  id: null,
});

const STORAGE_KEY = "settings";
const LOCAL_STORAGE_KEY = "picsum-frame";

/** Fill in defaults and drop invalid values from untrusted stored data. */
export function normalizeSettings(raw) {
  const d = DEFAULT_SETTINGS;
  if (!raw || typeof raw !== "object") return { ...d };

  const sizeOk = isValidDimension(raw.w) && isValidDimension(raw.h);
  const w = sizeOk ? raw.w : d.w;
  const h = sizeOk ? raw.h : d.h;
  const ratio = sizeOk && Number.isFinite(raw.ratio) && raw.ratio > 0 ? raw.ratio : w / h;
  const blur = Number.isInteger(raw.blur) && raw.blur >= 0 && raw.blur <= 10 ? raw.blur : d.blur;
  const id = typeof raw.id === "string" && /^\d+$/.test(raw.id) ? raw.id : d.id;

  return {
    w,
    h,
    ratio,
    lock: typeof raw.lock === "boolean" ? raw.lock : d.lock,
    tier: TIERS.includes(raw.tier) ? raw.tier : d.tier,
    grayscale: typeof raw.grayscale === "boolean" ? raw.grayscale : d.grayscale,
    blur,
    format: Object.hasOwn(FORMATS, raw.format) ? raw.format : d.format,
    id,
  };
}

const chromeStorage = () => globalThis.chrome?.storage?.local;

export async function loadSettings() {
  try {
    const storage = chromeStorage();
    const raw = storage
      ? (await storage.get(STORAGE_KEY))[STORAGE_KEY]
      : JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "null");
    return normalizeSettings(raw);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Best-effort; a failed save only means the popup starts fresh next time. */
export function saveSettings(settings) {
  try {
    const storage = chromeStorage();
    if (storage) storage.set({ [STORAGE_KEY]: settings });
    else localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}
