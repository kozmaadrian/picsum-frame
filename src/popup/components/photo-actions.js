// Credit line plus New photo / Copy link / Download, and their R / C / D shortcuts.

import { saveFile } from "../../lib/download.js";
import { formatDims } from "../../lib/format.js";
import { FORMATS, PICSUM_ORIGIN, fileName, shareUrl } from "../../lib/picsum.js";
import { byId, h } from "../dom.js";

const COPY_FEEDBACK_MS = 1400;

export function mountPhotoActions(store, actions) {
  const credit = byId("credit");
  const refreshBtn = byId("refreshBtn");
  const copyBtn = byId("copyBtn");
  const copyLabel = byId("copyLabel");
  const downloadBtn = byId("downloadBtn");
  const downloadMeta = byId("downloadMeta");
  let copyTimer = null;

  async function download() {
    const { photo } = store.get();
    if (!photo) return;
    const name = fileName(photo);
    try {
      await saveFile(photo.url, name);
      actions.announce(`Downloading ${name}.`);
    } catch {
      store.set({ error: "The download didn't start. Check Chrome's download settings and try again." });
    }
  }

  function showCopied(copied) {
    copyBtn.classList.toggle("is-done", copied);
    copyBtn.title = copied ? "Link copied" : "Copy image link (C)";
    copyLabel.textContent = copied ? "Link copied" : "Copy image link";
  }

  async function copyLink() {
    const { photo } = store.get();
    if (!photo) return;
    try {
      await navigator.clipboard.writeText(shareUrl(photo));
      showCopied(true);
      actions.announce("Image link copied.");
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => showCopied(false), COPY_FEEDBACK_MS);
    } catch {
      actions.announce("Couldn't copy the link.");
    }
  }

  refreshBtn.addEventListener("click", actions.newPhoto);
  copyBtn.addEventListener("click", copyLink);
  downloadBtn.addEventListener("click", download);

  const shortcuts = { r: refreshBtn, c: copyBtn, d: downloadBtn };
  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLInputElement && (target.type === "number" || target.type === "text")) return;
    const button = shortcuts[event.key.toLowerCase()];
    if (!button || button.disabled) return;
    event.preventDefault();
    button.click();
  });

  store.watch(
    (s) => s.status,
    (status) => {
      refreshBtn.disabled = status === "loading";
    },
  );

  store.watch(
    (s) => s.photo,
    (photo) => {
      copyBtn.disabled = !photo;
      downloadBtn.disabled = !photo;
      if (!photo) {
        downloadMeta.textContent = "";
        return;
      }
      const { label } = FORMATS[photo.format];
      downloadMeta.textContent = `${formatDims(photo.w, photo.h)} · ${label}`;
      downloadBtn.setAttribute("aria-label", `Download ${photo.w} by ${photo.h} ${label}`);
    },
  );

  store.watch(
    (s) => [s.photo?.id, s.credit],
    ([id, info]) => {
      if (!id) {
        credit.textContent = "\u00a0"; // keep the line's height before the first photo
        return;
      }
      credit.replaceChildren(`Photo #${id}`);
      if (info?.id !== id) return;
      credit.append(
        " by ",
        h(
          "a",
          {
            href: info.url || `${PICSUM_ORIGIN}/id/${id}/info`,
            target: "_blank",
            rel: "noopener noreferrer",
            title: "Open the original photo",
          },
          info.author,
        ),
      );
    },
  );
}
