// Service worker: clicking the toolbar icon (or Alt+Shift+P) opens the generator
// in the side panel.

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.error("Picsum Frame: couldn't set side panel behavior", err));
