// Preview stage: the artboard sized to the target ratio, redline measurements,
// the photo with its "develop" animation, and loading / error states.

import { formatNumber } from "../../lib/format.js";
import { byId, h } from "../dom.js";
import { makeDraggable } from "./photo-drag.js";

const MIN_BOARD = 18;
/** Room around the artboard for the height redline and side margins. */
const GUTTER_X = 64;
/** Room for the frame name above and the width redline below. */
const GUTTER_Y = 62;

export function mountStage(store, actions) {
  const stage = byId("stage");
  const artboard = byId("artboard");
  const frameName = byId("frameName");
  const redlineW = byId("rlW");
  const redlineH = byId("rlH");
  const message = byId("stageMsg");
  const messageText = byId("stageMsgText");
  // Created here: an empty <img> in markup would render as a broken image.
  const image = h("img", { alt: "", decoding: "async" });
  makeDraggable(image, store);

  byId("retryBtn").addEventListener("click", actions.retry);

  /** Scale the artboard to fit the stage at the target ratio. */
  function fit() {
    const { w, h } = store.get().settings;
    const scale = Math.min((stage.clientWidth - GUTTER_X) / w, (stage.clientHeight - GUTTER_Y) / h);
    artboard.style.width = `${Math.max(MIN_BOARD, Math.round(w * scale))}px`;
    artboard.style.height = `${Math.max(MIN_BOARD, Math.round(h * scale))}px`;
  }

  store.watch(
    (s) => [s.settings.w, s.settings.h],
    ([w, h]) => {
      fit();
      redlineW.textContent = formatNumber(w);
      redlineH.textContent = formatNumber(h);
    },
  );

  // The side panel is resizable; refit without the morph animation.
  let settled = null;
  new ResizeObserver(() => {
    artboard.classList.add("is-resizing");
    fit();
    cancelAnimationFrame(settled);
    settled = requestAnimationFrame(() => artboard.classList.remove("is-resizing"));
  }).observe(stage);

  store.watch(
    (s) => s.photo,
    (photo) => {
      if (!photo) {
        frameName.textContent = "picsum";
        return;
      }
      if (!image.isConnected) artboard.prepend(image);
      image.src = photo.dragUrl ?? photo.url;
      image.alt = `Placeholder photo #${photo.id}, ${photo.w} by ${photo.h} pixels`;
      image.classList.remove("developing");
      void image.offsetWidth; // restart the develop animation
      image.classList.add("developing");
      artboard.classList.remove("is-empty");
      frameName.textContent = `picsum #${photo.id}`;
    },
  );

  store.watch(
    (s) => s.status,
    (status) => {
      artboard.classList.toggle("is-loading", status === "loading");
      artboard.classList.toggle("is-error", status === "error");
      if (status === "loading") artboard.setAttribute("aria-busy", "true");
      else artboard.removeAttribute("aria-busy");
    },
  );

  store.watch(
    (s) => s.error,
    (error) => {
      messageText.textContent = error ?? "";
      message.hidden = !error;
    },
  );
}
