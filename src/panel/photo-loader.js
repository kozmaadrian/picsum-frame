// Loads photos into the store: cancels stale requests, debounces size typing,
// owns the object URL lifecycle, serves each photo for dragging, and fetches the
// photographer credit.

import { FORMATS, fetchPhoto, fetchPhotoInfo, fileName } from "../lib/picsum.js";
import { decodeImage } from "./dom.js";

const DEBOUNCE_MS = 450;

export function createPhotoLoader(store, { announce, dragFiles }) {
  let controller = null;
  let timer = null;

  async function loadCredit(id) {
    const info = await fetchPhotoInfo(id);
    if (!info?.author || store.get().photo?.id !== id) return;
    store.set({ credit: { id, author: info.author, url: info.url || null } });
  }

  /**
   * The named URL the service worker serves the photo at, decoded and ready to
   * show, or null (e.g. opened as a plain page, with no service worker).
   */
  async function serveForDrag(blob, photo) {
    try {
      const url = await dragFiles.serve(blob, fileName(photo), FORMATS[photo.format].mime);
      await decodeImage(url);
      return url;
    } catch {
      return null;
    }
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
      const dragUrl = await serveForDrag(blob, photo);
      if (!dragUrl) {
        try {
          await decodeImage(url);
        } catch (err) {
          URL.revokeObjectURL(url);
          throw err;
        }
      }
      if (signal.aborted) {
        URL.revokeObjectURL(url);
        return;
      }

      const previous = store.get().photo;
      store.set((state) => ({
        settings: { ...state.settings, id: photo.id },
        photo: { ...photo, url, dragUrl },
        status: "idle",
        credit: state.credit?.id === photo.id ? state.credit : null,
      }));
      // Nothing shows or downloads the old photo any more, so its URL can go.
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
