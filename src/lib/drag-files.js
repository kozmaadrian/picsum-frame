// Named photo files for drag-and-drop, shared by the side panel (writes) and the
// service worker (serves them at `<extension origin>/drag/<file name>`).
//
// Chrome on macOS only turns a dragged <img> into a File for the drop target when
// the image response names a file (Content-Disposition). blob: URLs have no
// headers, so the panel stores each photo in the Cache API with that header and
// the preview shows it from the served URL instead.

export const DRAG_PATH = "/drag/";
export const DRAG_CACHE = "picsum-frame-drag";

// The Cache API only accepts http(s) keys, so entries are keyed on this
// stand-in origin; it's never fetched.
const KEY_ORIGIN = "https://drag.picsum-frame.invalid";

/** Cache key for a /drag/ path. */
export function dragCacheKey(pathname) {
  return `${KEY_ORIGIN}${pathname}`;
}

/** A response that names its file, so drops receive it as `name`. */
export function dragResponse(blob, name, type) {
  return new Response(blob, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `inline; filename="${name.replace(/["\\]/g, "_")}"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Panel side: `serve(blob, name, type)` stores a photo and resolves to the URL
 * the service worker serves it at. Keeps the `keep` most recent photos, so a
 * drag in progress never loses its file.
 */
export function createDragFiles({ keep = 4, cacheStorage = globalThis.caches, origin = globalThis.location?.origin } = {}) {
  const recent = [];
  let ready = null;

  // Start clean: photos from earlier panels are no longer on screen to drag.
  const open = () => (ready ??= cacheStorage.delete(DRAG_CACHE).then(() => cacheStorage.open(DRAG_CACHE)));

  async function serve(blob, name, type) {
    const path = `${DRAG_PATH}${encodeURIComponent(name)}`;
    const cache = await open();
    await cache.put(dragCacheKey(path), dragResponse(blob, name, type));

    const index = recent.indexOf(path);
    if (index >= 0) recent.splice(index, 1);
    recent.push(path);
    await Promise.all(recent.splice(0, Math.max(0, recent.length - keep)).map((stale) => cache.delete(dragCacheKey(stale))));

    return `${origin}${path}`;
  }

  return { serve };
}
