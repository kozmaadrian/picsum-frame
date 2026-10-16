// Loads photos into the store: cancels stale requests, debounces size typing,
// owns the object URL lifecycle, and fetches the photographer credit.

import { fetchPhoto, fetchPhotoInfo } from "../lib/picsum.js";

const DEBOUNCE_MS = 450;

function decodeImage(url) {
  const image = new Image();
  image.src = url;
  return image.decode();
}

export function createPhotoLoader(store, { announce }) {
  let controller = null;
  let timer = null;

  async function loadCredit(id) {
    const info = await fetchPhotoInfo(id);
    if (!info?.author || store.get().photo?.id !== id) return;
    store.set({ credit: { id, author: info.author, url: info.url || null } });
  }

  /** Load the photo for the current settings; `random` picks a different photo. */
  async function load({ random = false } = {}) {
    cancelScheduled();
    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;

    const { settings } = store.get();
    store.set({ status: "loading", error: null });

    try {
      const { blob, ...photo } = await fetchPhoto(settings, { random, signal });
      const url = URL.createObjectURL(blob);
      try {
        await decodeImage(url);
      } catch (err) {
        URL.revokeObjectURL(url);
        throw err;
      }
      if (signal.aborted) {
        URL.revokeObjectURL(url);
        return;
      }

      const previous = store.get().photo;
      store.set((state) => ({
        settings: { ...state.settings, id: photo.id },
        photo: { ...photo, url },
        status: "idle",
        credit: state.credit?.id === photo.id ? state.credit : null,
      }));
      // The preview already points at the new URL, so the old one can go.
      if (previous) URL.revokeObjectURL(previous.url);

      announce(`Photo ${photo.id} loaded at ${photo.w} by ${photo.h}.`);
      loadCredit(photo.id);
    } catch (err) {
      if (signal.aborted || err.name === "AbortError") return;
      const offline = navigator.onLine === false;
      store.set({
        status: "error",
        error: offline
          ? "You're offline. Reconnect, then try again."
          : "Picsum didn't return an image. Try again in a moment.",
      });
      announce("Couldn't load the photo.");
    }
  }

  /** Load after typing settles. */
  function schedule() {
    cancelScheduled();
    timer = setTimeout(load, DEBOUNCE_MS);
  }

  function cancelScheduled() {
    clearTimeout(timer);
    timer = null;
  }

  return { load, schedule, cancelScheduled };
}
