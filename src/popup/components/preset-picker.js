// Ratio preset chips: a radiogroup with arrow-key navigation.

import { PRESETS, findPreset, presetSize } from "../../lib/ratios.js";
import { byId, h } from "../dom.js";

const GLYPH_MAX_W = 28;
const GLYPH_MAX_H = 18;
/** Arrow key → index offset in the 5-column grid. */
const ARROW_STEP = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 5, ArrowUp: -5 };

function presetButton(preset) {
  const [pw, ph] = preset.sizes[1];
  const scale = Math.min(GLYPH_MAX_W / pw, GLYPH_MAX_H / ph);
  const glyph = h("i", { style: { width: `${Math.round(pw * scale)}px`, height: `${Math.round(ph * scale)}px` } });

  return h(
    "button",
    {
      type: "button",
      className: "preset",
      role: "radio",
      title: `${preset.name} · ${preset.label}`,
      "aria-label": `${preset.name}, ${preset.label}`,
    },
    h("span", { className: "preset-glyph" }, glyph),
    h("span", { className: "preset-ratio" }, preset.label),
    h("span", { className: "preset-name" }, preset.name),
  );
}

export function mountPresetPicker(store, actions) {
  const group = byId("presets");
  const buttons = PRESETS.map((preset) => {
    const button = presetButton(preset);
    button.addEventListener("click", () => {
      const [w, h] = presetSize(preset, store.get().settings.tier);
      actions.updateSettings({ w, h, ratio: w / h, lock: true }, { reload: "now" });
    });
    return button;
  });
  group.append(...buttons);

  group.addEventListener("keydown", (event) => {
    const step = ARROW_STEP[event.key];
    if (!step) return;
    event.preventDefault();
    const index = buttons.indexOf(document.activeElement);
    const next = buttons[(index + step + buttons.length) % buttons.length];
    next.focus();
    next.click();
  });

  store.watch(
    (s) => [s.settings.w, s.settings.h],
    ([w, h]) => {
      const active = findPreset(w, h);
      buttons.forEach((button, i) => {
        const on = PRESETS[i] === active;
        button.setAttribute("aria-checked", String(on));
        button.tabIndex = on ? 0 : -1;
      });
      // Keep the group reachable by Tab when the size is custom.
      if (!active) buttons[0].tabIndex = 0;
    },
  );
}
