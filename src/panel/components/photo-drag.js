// Drag the preview out of the side panel into a page's upload area (it receives
// the photo as a named image file) or onto the desktop (a download).
//
// The drop target gets Chrome's own <img> drag payload; the file name comes from
// the served preview URL (photo.dragUrl, see lib/drag-files.js). This only adds
// links for text fields and a named download for the desktop.

import { FORMATS, fileName, shareUrl } from "../../lib/picsum.js";

export function makeDraggable(image, store) {
  image.draggable = true;
  image.title = "Drag into an upload area, or onto your desktop";

  image.addEventListener("dragstart", (event) => {
    const { photo, status } = store.get();
    if (!photo || status === "loading") {
      event.preventDefault();
      return;
    }

    const url = shareUrl(photo);
    const data = event.dataTransfer;
    data.setData("text/uri-list", url);
    data.setData("text/plain", url);
    data.setData("text/html", `<img src="${url}" alt="" width="${photo.w}" height="${photo.h}">`);
    data.setData("DownloadURL", `${FORMATS[photo.format].mime}:${fileName(photo)}:${url}`);
    data.effectAllowed = "copy";
  });
}
