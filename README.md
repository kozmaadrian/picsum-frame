# Picsum Frame

A Chrome extension that generates placeholder photos from [Lorem Picsum](https://picsum.photos/) at an exact size, previews them, and downloads the ones you like.

## Install

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.
4. Pin **Picsum Frame** to the toolbar. You can also open it with <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>.

## Use

- **Ratio presets**: 16:9 Hero, 1.91:1 OG card, 21:9 Banner, 3:1 Header, 3:2 Photo, 4:3 Card, 1:1 Square, 4:5 Portrait, 2:3 Tall, 9:16 Mobile.
- **Small / Medium / Large**: picks a standard size for the current ratio (e.g. 16:9 → 640×360, 1280×720, 1920×1080). The choice carries over when you switch presets. For custom ratios, the long edge is 640, 1280 or 2560 px. Hover a button to see its exact size.
- **Exact size**: type a width or height (1–5000 px). With the link toggle on, the aspect ratio stays locked. The arrows button swaps between portrait and landscape.
- **New photo** (<kbd>R</kbd>): loads a different random photo. Changing size, grayscale, blur, or format keeps the current photo.
- **Download** (<kbd>D</kbd>): saves exactly the image in the preview, as `picsum-<id>-<w>x<h>.jpg|webp`.
- **Copy link** (<kbd>C</kbd>): copies a stable Picsum URL for the current photo and settings, ready to paste into a mockup.

Your last size, effects, and photo are remembered between popup opens.

## Project structure

No build step: the extension loads plain ES modules straight from `src/`.

```
manifest.json              Manifest V3 config (downloads, storage; hosts: picsum.photos)
assets/icons/              Toolbar icons (generated)
src/
  lib/                     Framework-free logic, unit-tested in Node
    picsum.js              Picsum URLs, fetchPhoto (with id → random fallback), photo info
    ratios.js              Ratio presets, S/M/L tiers, ratio labels, size validation
    settings.js            Persisted settings: defaults, validation, chrome.storage / localStorage
    download.js            Save a file via chrome.downloads (or <a download> as a page)
    format.js              Number and dimension formatting
  popup/
    popup.html             Markup
    main.js                Entry point: creates the store and mounts the components
    store.js               Small observable state (get / set / subscribe / watch)
    photo-loader.js        Fetch, cancel, debounce, object-URL lifecycle, credit lookup
    announce.js            Screen-reader live region
    dom.js                 byId / element builder helpers
    components/            One module per UI area; each watches only the state it renders
      stage.js             Artboard, redlines, develop animation, error message
      photo-actions.js     Credit, New photo, Copy link, Download, keyboard shortcuts
      preset-picker.js     Ratio preset radiogroup
      size-controls.js     S/M/L tiers, W × H inputs, lock, swap, validation
      effects-controls.js  Grayscale, blur, format
    styles/                tokens, base, buttons, and one stylesheet per component
scripts/generate-icons.mjs Dependency-free PNG icon generator
tests/                     node:test unit tests for src/lib and the store
PRODUCT.md                 Product context for future design work
```

State flows one way: components call `actions.updateSettings(patch, { reload })` and re-render from the store. Settings are saved whenever they change.

## Develop

Requires Node 20+ for the scripts. No dependencies are needed.

- `npm test`: run the unit tests.
- `npm run icons`: regenerate `assets/icons/`.
- After editing, click the reload icon on the extension card in `chrome://extensions`.
- To work on the UI in a normal tab, serve the folder (`python3 -m http.server`) and open `/src/popup/popup.html`. It falls back to `localStorage` and a regular link download.

## License

[Apache License 2.0](LICENSE) (see also [NOTICE](NOTICE)). Photos are served by [Lorem Picsum](https://picsum.photos/) from [Unsplash](https://unsplash.com/) under their own license.

Unofficial. Not affiliated with or endorsed by Lorem Picsum or Unsplash. The extension only calls Picsum's public API and doesn't bundle or redistribute any photos.
