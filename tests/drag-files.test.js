import assert from "node:assert/strict";
import { test } from "node:test";

import { DRAG_CACHE, createDragFiles, dragCacheKey, dragResponse } from "../src/lib/drag-files.js";

function fakeCacheStorage() {
  const caches = new Map();
  return {
    caches,
    async delete(name) {
      return caches.delete(name);
    },
    async open(name) {
      if (!caches.has(name)) caches.set(name, new Map());
      const entries = caches.get(name);
      return {
        put: async (key, response) => void entries.set(key, response),
        delete: async (key) => entries.delete(key),
      };
    },
  };
}

test("dragResponse names the file and keeps the type and bytes", async () => {
  const response = dragResponse(new Blob(["abc"]), "picsum-1-10x10.jpg", "image/jpeg");
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.equal(response.headers.get("content-disposition"), 'inline; filename="picsum-1-10x10.jpg"');
  assert.equal(await response.text(), "abc");
});

test("dragResponse can't break out of the quoted file name", () => {
  const response = dragResponse(new Blob([]), 'a"b\\c.jpg', "image/jpeg");
  assert.equal(response.headers.get("content-disposition"), 'inline; filename="a_b_c.jpg"');
});

test("serve stores the photo and returns its URL on the extension origin", async () => {
  const storage = fakeCacheStorage();
  const files = createDragFiles({ cacheStorage: storage, origin: "chrome-extension://abc" });
  const url = await files.serve(new Blob(["x"]), "picsum-1-10x10.jpg", "image/jpeg");

  assert.equal(url, "chrome-extension://abc/drag/picsum-1-10x10.jpg");
  const stored = storage.caches.get(DRAG_CACHE).get(dragCacheKey("/drag/picsum-1-10x10.jpg"));
  assert.equal(stored.headers.get("content-disposition"), 'inline; filename="picsum-1-10x10.jpg"');
});

test("serve keeps only the most recent photos and starts from an empty cache", async () => {
  const storage = fakeCacheStorage();
  storage.caches.set(DRAG_CACHE, new Map([["stale-from-last-panel", null]]));
  const files = createDragFiles({ keep: 2, cacheStorage: storage, origin: "chrome-extension://abc" });

  for (const name of ["1.jpg", "2.jpg", "1.jpg", "3.jpg"]) await files.serve(new Blob([]), name, "image/jpeg");

  assert.deepEqual([...storage.caches.get(DRAG_CACHE).keys()].sort(), [dragCacheKey("/drag/1.jpg"), dragCacheKey("/drag/3.jpg")]);
});
