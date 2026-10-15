// Saves a file: chrome.downloads in the extension, an <a download> click as a plain page.

export async function saveFile(url, filename) {
  const downloads = globalThis.chrome?.downloads;
  if (downloads?.download) {
    await downloads.download({ url, filename, saveAs: false });
    return;
  }
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
}
