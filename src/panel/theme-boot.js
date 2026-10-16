// Classic blocking script: applies a forced theme before first paint, so the panel never flashes
// the system theme first. Mirrors THEME_STORAGE_KEY in src/lib/theme.js.
try {
  const theme = localStorage.getItem("picsum-frame-theme");
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
} catch {
  /* follow the system */
}
