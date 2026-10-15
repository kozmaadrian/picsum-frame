// Popup entry point: load settings, create the store, mount each part of the UI.

import { loadSettings, saveSettings } from "../lib/settings.js";
import { createAnnouncer } from "./announce.js";
import { mountEffectsControls } from "./components/effects-controls.js";
import { mountPhotoActions } from "./components/photo-actions.js";
import { mountPresetPicker } from "./components/preset-picker.js";
import { mountSizeControls } from "./components/size-controls.js";
import { mountStage } from "./components/stage.js";
import { byId } from "./dom.js";
import { createPhotoLoader } from "./photo-loader.js";
import { createStore } from "./store.js";

const store = createStore({
  settings: await loadSettings(),
  /** The photo on screen: { id, w, h, grayscale, blur, format, url } (url is a blob: URL). */
  photo: null,
  /** "idle" | "loading" | "error" */
  status: "idle",
  /** Message shown over the stage, or null. */
  error: null,
  /** { id, author, url } for the current photo, once known. */
  credit: null,
});

const announce = createAnnouncer(byId("live"));
const loader = createPhotoLoader(store, { announce });

const actions = {
  announce,
  /** Merge into settings; `reload` is "now", "debounce", or false. */
  updateSettings(patch, { reload = false } = {}) {
    store.set((state) => ({ settings: { ...state.settings, ...patch } }));
    if (reload === "now") loader.load();
    else if (reload === "debounce") loader.schedule();
  },
  reload: () => loader.load(),
  cancelReload: () => loader.cancelScheduled(),
  newPhoto: () => loader.load({ random: true }),
  retry: () => loader.load({ random: !store.get().photo }),
};

store.subscribe((state, prev) => {
  if (state.settings !== prev.settings) saveSettings(state.settings);
});

mountStage(store, actions);
mountPhotoActions(store, actions);
mountPresetPicker(store, actions);
mountSizeControls(store, actions);
mountEffectsControls(store, actions);

loader.load();
