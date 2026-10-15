// Lorem Picsum API: URL building, fetching photos, and photo metadata.
// https://picsum.photos

export const PICSUM_ORIGIN = "https://picsum.photos";

/** Picsum rejects sizes above this (HTTP 400). */
export const MAX_SIZE = 5000;

export const FORMATS = Object.freeze({
  jpg: Object.freeze({ ext: "jpg", label: "JPG" }),
  webp: Object.freeze({ ext: "webp", label: "WebP" }),
});

export class PicsumError extends Error {
  constructor(message) {
    super(message);
    this.name = "PicsumError";
  }
}

function effectsQuery({ grayscale, blur }, extra = []) {
  const parts = [];
  if (grayscale) parts.push("grayscale");
  if (blur > 0) parts.push(`blur=${blur}`);
  parts.push(...extra);
  return parts.length ? `?${parts.join("&")}` : "";
}

/**
 * URL for a photo request. With an `id` (and `random` false) Picsum returns that exact photo;
 * otherwise it picks a random one. `nonce` defeats caching of random requests.
 */
export function imageUrl(spec, { random = false, nonce = Date.now() } = {}) {
  const { id, w, h, format } = spec;
  const path = id != null && !random ? `/id/${id}/${w}/${h}` : `/${w}/${h}`;
  const extra = random ? [`random=${nonce}`] : [];
  return `${PICSUM_ORIGIN}${path}.${FORMATS[format].ext}${effectsQuery(spec, extra)}`;
}

/** Stable, shareable URL that always resolves to the same photo, size, and effects. */
export function shareUrl(photo) {
  return `${PICSUM_ORIGIN}/id/${photo.id}/${photo.w}/${photo.h}.${FORMATS[photo.format].ext}${effectsQuery(photo)}`;
}

/** e.g. `picsum-806-1200x630-gray-blur2.webp` */
export function fileName(photo) {
  const effects = [photo.grayscale && "gray", photo.blur > 0 && `blur${photo.blur}`].filter(Boolean);
  const suffix = effects.length ? `-${effects.join("-")}` : "";
  return `picsum-${photo.id}-${photo.w}x${photo.h}${suffix}.${FORMATS[photo.format].ext}`;
}

/** Photo id from the `Picsum-Id` header, or from the redirected `/id/<n>/` URL. */
export function photoIdFrom(response) {
  return response.headers.get("picsum-id") || response.url.match(/\/id\/(\d+)\//)?.[1] || null;
}

/**
 * Fetch the exact image file for `spec` ({ id, w, h, grayscale, blur, format }).
 * Resolves to the spec plus the resolved `id` and the image `blob`.
 */
export async function fetchPhoto(spec, { random = false, signal, fetchImpl = fetch } = {}) {
  const wantRandom = random || spec.id == null;
  const request = (rnd) => fetchImpl(imageUrl(spec, { random: rnd }), { signal, cache: "no-store" });

  let response = await request(wantRandom);
  // A remembered photo can disappear from Picsum; fall back to a random one.
  if (!response.ok && !wantRandom) response = await request(true);

  if (!response.ok) throw new PicsumError(`Picsum responded with HTTP ${response.status}.`);
  if (!(response.headers.get("content-type") || "").startsWith("image/")) {
    throw new PicsumError("Picsum didn't return an image.");
  }

  const id = photoIdFrom(response);
  if (!id) throw new PicsumError("Picsum didn't say which photo it returned.");

  const blob = await response.blob();
  const { w, h, grayscale, blur, format } = spec;
  return { id, w, h, grayscale, blur, format, blob };
}

const infoCache = new Map();

/** Author and source link for a photo, or null. Cached per id; failures aren't cached. */
export function fetchPhotoInfo(id, { fetchImpl = fetch } = {}) {
  if (!infoCache.has(id)) {
    const pending = fetchImpl(`${PICSUM_ORIGIN}/id/${id}/info`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((info) => {
        if (!info) infoCache.delete(id);
        return info;
      });
    infoCache.set(id, pending);
  }
  return infoCache.get(id);
}
