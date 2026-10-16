// Grayscale, blur, and file format.

import { byId } from "../dom.js";

const blurText = (blur) => (blur ? String(blur) : "Off");

export function mountEffectsControls(store, actions) {
  const gray = byId("gray");
  const blur = byId("blur");
  const blurOut = byId("blurOut");
  const formatInputs = [...document.querySelectorAll('input[name="format"]')];

  gray.addEventListener("change", () => {
    actions.updateSettings({ grayscale: gray.checked }, { reload: "now" });
  });

  // Preview the number while dragging; fetch once the thumb is released.
  blur.addEventListener("input", () => {
    blurOut.textContent = blurText(Number(blur.value));
  });
  blur.addEventListener("change", () => {
    actions.updateSettings({ blur: Number(blur.value) }, { reload: "now" });
  });

  for (const input of formatInputs) {
    input.addEventListener("change", () => {
      if (input.checked) actions.updateSettings({ format: input.value }, { reload: "now" });
    });
  }

  store.watch(
    (s) => [s.settings.grayscale, s.settings.blur, s.settings.format],
    ([grayscale, blurLevel, format]) => {
      gray.checked = grayscale;
      blur.value = String(blurLevel);
      blurOut.textContent = blurText(blurLevel);
      for (const input of formatInputs) input.checked = input.value === format;
    },
  );
}
