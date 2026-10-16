// Service worker.
// - Clicking the toolbar icon (or Alt+Shift+P) opens the generator in the side
//   panel, which, unlike a popup, stays open while you drag the photo into a page.
// - Serves the panel's preview photos with a file name (see lib/drag-files.js).

import { DRAG_CACHE, DRAG_PATH, dragCacheKey } from "./lib/drag-files.js";

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.error("Picsum Frame: couldn't set side panel behavior", err));

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(DRAG_PATH)) return;
  event.respondWith(
    caches
      .open(DRAG_CACHE)
      .then((cache) => cache.match(dragCacheKey(url.pathname)))
      .then((response) => response ?? new Response("Not found", { status: 404 })),
  );
});
