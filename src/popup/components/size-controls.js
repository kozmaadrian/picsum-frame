// Size panel: Small / Medium / Large tiers, exact W × H inputs, ratio lock, swap.
// Typing is validated here; only valid sizes are committed to the store.

import { formatDims, formatNumber } from "../../lib/format.js";
import { MAX_SIZE } from "../../lib/picsum.js";
import { TIER_NAMES, isValidDimension, ratioLabel, sizeForTier, tierOf } from "../../lib/ratios.js";
import { byId } from "../dom.js";

const INVALID_HINT = `Use whole pixels from 1 to ${formatNumber(MAX_SIZE)}. Picsum doesn't serve larger images.`;

const parseDimension = (value) => Math.round(Number(value));

export function mountSizeControls(store, actions) {
  const inputs = { w: byId("w"), h: byId("h") };
  const lockBtn = byId("lockBtn");
  const swapBtn = byId("swapBtn");
  const readout = byId("ratioReadout");
  const hint = byId("sizeHint");
  const tierInputs = [...byId("tiers").querySelectorAll('input[name="tier"]')];

  const typed = () => ({ w: parseDimension(inputs.w.value), h: parseDimension(inputs.h.value) });

  /** Reflect the typed values' validity; returns true when both are usable. */
  function showValidity() {
    const { w, h } = typed();
    const ok = { w: isValidDimension(w), h: isValidDimension(h) };
    for (const key of ["w", "h"]) {
      inputs[key].closest(".num").classList.toggle("is-invalid", !ok[key]);
      inputs[key].setAttribute("aria-invalid", String(!ok[key]));
    }
    const valid = ok.w && ok.h;
    hint.textContent = valid ? "" : INVALID_HINT;
    for (const input of tierInputs) input.disabled = !valid;
    if (!valid) readout.textContent = "";
    return valid;
  }

  function onType(edited) {
    const { settings } = store.get();
    const value = parseDimension(inputs[edited].value);

    if (settings.lock && Number.isFinite(value) && value > 0) {
      const other = edited === "w" ? "h" : "w";
      const derived = edited === "w" ? value / settings.ratio : value * settings.ratio;
      inputs[other].value = Math.max(1, Math.round(derived));
    }

    if (!showValidity()) {
      actions.cancelReload();
      return;
    }
    const { w, h } = typed();
    const ratio = settings.lock ? settings.ratio : w / h;
    actions.updateSettings({ w, h, ratio }, { reload: "debounce" });
  }

  for (const key of ["w", "h"]) {
    const input = inputs[key];
    input.addEventListener("input", () => onType(key));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && showValidity()) actions.reload();
    });
    // Normalize what's shown (e.g. "0720" or "719.6") once editing ends.
    input.addEventListener("blur", () => {
      if (!showValidity()) return;
      const { settings } = store.get();
      inputs.w.value = settings.w;
      inputs.h.value = settings.h;
    });
  }

  lockBtn.addEventListener("click", () => {
    const { settings } = store.get();
    actions.updateSettings({ lock: !settings.lock, ratio: settings.w / settings.h });
  });

  swapBtn.addEventListener("click", () => {
    if (!showValidity()) return;
    const { w, h } = store.get().settings;
    actions.updateSettings({ w: h, h: w, ratio: h / w }, { reload: "now" });
  });

  for (const input of tierInputs) {
    input.addEventListener("change", () => {
      if (!input.checked || !showValidity()) return;
      const { settings } = store.get();
      const [w, h] = sizeForTier(input.value, settings.w, settings.h);
      actions.updateSettings({ tier: input.value, w, h, ratio: w / h }, { reload: "now" });
    });
  }

  store.watch(
    (s) => s.settings.lock,
    (lock) => {
      lockBtn.setAttribute("aria-pressed", String(lock));
      lockBtn.title = lock ? "Aspect ratio locked" : "Aspect ratio unlocked";
    },
  );

  store.watch(
    (s) => [s.settings.w, s.settings.h],
    ([w, h]) => {
      // Don't fight the user's caret in the field they're typing in.
      for (const key of ["w", "h"]) {
        if (document.activeElement !== inputs[key]) inputs[key].value = key === "w" ? w : h;
      }

      readout.textContent = ratioLabel(w, h);
      const tier = tierOf(w, h);
      for (const input of tierInputs) {
        const [tw, th] = sizeForTier(input.value, w, h);
        input.checked = input.value === tier;
        input.parentElement.title = `${TIER_NAMES[input.value]} · ${formatDims(tw, th)}`;
        input.setAttribute("aria-label", `${TIER_NAMES[input.value]}, ${tw} by ${th}`);
      }
      showValidity();
    },
  );
}
