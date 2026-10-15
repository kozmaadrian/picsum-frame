import assert from "node:assert/strict";
import { test } from "node:test";

import { PicsumError, fetchPhoto, fileName, imageUrl, photoIdFrom, shareUrl } from "../src/lib/picsum.js";

const spec = { id: "42", w: 1200, h: 630, grayscale: false, blur: 0, format: "jpg" };

test("imageUrl targets a photo id unless random", () => {
  assert.equal(imageUrl(spec), "https://picsum.photos/id/42/1200/630.jpg");
  assert.equal(imageUrl(spec, { random: true, nonce: 7 }), "https://picsum.photos/1200/630.jpg?random=7");
  assert.equal(imageUrl({ ...spec, id: null }), "https://picsum.photos/1200/630.jpg");
});

test("imageUrl and shareUrl include effects and format", () => {
  const fx = { ...spec, grayscale: true, blur: 3, format: "webp" };
  assert.equal(imageUrl(fx, { random: true, nonce: 1 }), "https://picsum.photos/1200/630.webp?grayscale&blur=3&random=1");
  assert.equal(shareUrl(fx), "https://picsum.photos/id/42/1200/630.webp?grayscale&blur=3");
});

test("fileName describes the photo", () => {
  assert.equal(fileName(spec), "picsum-42-1200x630.jpg");
  assert.equal(fileName({ ...spec, grayscale: true, blur: 2, format: "webp" }), "picsum-42-1200x630-gray-blur2.webp");
});

function imageResponse({ id, url = "https://fastly.picsum.photos/x.jpg", status = 200, type = "image/jpeg" } = {}) {
  const response = new Response(new Blob(["img"], { type }), {
    status,
    headers: { "content-type": type, ...(id ? { "picsum-id": id } : {}) },
  });
  Object.defineProperty(response, "url", { value: url });
  return response;
}

test("photoIdFrom reads the header, then the redirected URL", () => {
  assert.equal(photoIdFrom(imageResponse({ id: "9" })), "9");
  assert.equal(photoIdFrom(imageResponse({ url: "https://fastly.picsum.photos/id/806/10/10.jpg?hmac=x" })), "806");
  assert.equal(photoIdFrom(imageResponse()), null);
});

test("fetchPhoto returns the spec, resolved id, and blob", async () => {
  const calls = [];
  const fetchImpl = async (url) => (calls.push(url), imageResponse({ id: "42" }));
  const photo = await fetchPhoto(spec, { fetchImpl });
  assert.deepEqual(calls, ["https://picsum.photos/id/42/1200/630.jpg"]);
  assert.equal(photo.id, "42");
  assert.equal(photo.w, 1200);
  assert.ok(photo.blob instanceof Blob);
});

test("fetchPhoto falls back to a random photo when the id is gone", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    return calls.length === 1 ? imageResponse({ status: 404, type: "text/plain" }) : imageResponse({ id: "7" });
  };
  const photo = await fetchPhoto(spec, { fetchImpl });
  assert.equal(calls.length, 2);
  assert.match(calls[1], /^https:\/\/picsum\.photos\/1200\/630\.jpg\?random=\d+$/);
  assert.equal(photo.id, "7");
});

test("fetchPhoto rejects non-images and unknown ids", async () => {
  await assert.rejects(
    fetchPhoto(spec, { random: true, fetchImpl: async () => imageResponse({ id: "1", type: "text/html" }) }),
    PicsumError,
  );
  await assert.rejects(fetchPhoto(spec, { random: true, fetchImpl: async () => imageResponse() }), PicsumError);
  await assert.rejects(
    fetchPhoto(spec, { random: true, fetchImpl: async () => imageResponse({ status: 503 }) }),
    /HTTP 503/,
  );
});
