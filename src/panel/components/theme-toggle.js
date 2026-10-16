// Cycles the panel theme: System → Light → Dark.

import { THEME_NAMES, applyTheme, currentTheme, nextTheme } from "../../lib/theme.js";
import { byId } from "../dom.js";

export function mountThemeToggle({ announce }) {
  const button = byId("themeBtn");

  function render(theme) {
    button.dataset.mode = theme;
    button.title = `Theme: ${THEME_NAMES[theme]}`;
    button.setAttribute("aria-label", `Theme: ${THEME_NAMES[theme]}. Switch to ${THEME_NAMES[nextTheme(theme)]}`);
  }

  button.addEventListener("click", () => {
    const theme = nextTheme(currentTheme());
    applyTheme(theme);
    render(theme);
    announce(`${THEME_NAMES[theme]} theme.`);
  });

  render(currentTheme());
}
