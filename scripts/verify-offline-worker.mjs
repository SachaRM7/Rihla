import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const context = { self: {}, Headers, Response };
runInNewContext(await readFile(new URL("../public/offline-worker.js", import.meta.url), "utf8"), context);
const worker = context.self.RihlaOffline;
const response = () => new Response(new Uint8Array([1, 2, 3, 4, 5]), { headers: { "content-type": "audio/mpeg" } });
for (const [range, bytes, contentRange] of [["bytes=1-3", [2, 3, 4], "bytes 1-3/5"], ["bytes=3-", [4, 5], "bytes 3-4/5"], ["bytes=-2", [4, 5], "bytes 3-4/5"], ["bytes=0-99", [1, 2, 3, 4, 5], "bytes 0-4/5"]]) {
  const result = await worker.mediaResponse(response(), range);
  assert.equal(result.status, 206);
  assert.equal(result.headers.get("content-range"), contentRange);
  assert.equal(result.headers.get("content-length"), String(bytes.length));
  assert.deepEqual([...new Uint8Array(await result.arrayBuffer())], bytes);
}
for (const range of ["bytes=6-", "bytes=3-1", "bytes=-0", "bytes=", "bytes=0-1,3-4", "bytes=90071992547409999-"]) {
  const result = await worker.mediaResponse(response(), range);
  assert.equal(result.status, 416, range);
  assert.equal(result.headers.get("content-range"), "bytes */5");
}
assert.equal((await worker.mediaResponse(response(), null)).status, 200);
for (const path of ["/", "/quran/1", "/content/pickthall-al-fatiha-audio"]) assert.ok(worker.isPublicNavigation(new URL(path, "https://rihla.test"), "https://rihla.test"));
for (const path of ["/auth/callback?code=secret", "/api/quran/surahs", "/admin", "https://another.test/"]) assert.equal(worker.isPublicNavigation(new URL(path, "https://rihla.test"), "https://rihla.test"), false);
console.log("Offline worker: byte ranges, invalid ranges, public routes and private exclusions passed.");

const origin = "https://rihla.test";
const buckets = new Map();
const handlers = new Map();
const network = [];
let offlineNetwork = false;
let claimed = false;
let skipped = false;
class OriginRequest extends Request {
  constructor(input, init) { super(typeof input === "string" ? new URL(input, origin) : input, init); }
}
const cacheStorage = {
  async open(name) {
    if (!buckets.has(name)) {
      const entries = new Map();
      buckets.set(name, {
        entries,
        async addAll(requests) {
          for (const request of requests) {
            assert.equal(request.credentials, "omit");
            assert.equal(request.redirect, "error");
            entries.set(request.url, new Response(request.url));
          }
        },
        async match(request) { return entries.get(new URL(typeof request === "string" ? request : request.url, origin).href)?.clone(); },
      });
    }
    return buckets.get(name);
  },
  async keys() { return [...buckets.keys()]; },
  async delete(name) { return buckets.delete(name); },
};
const scope = {
  RihlaOffline: worker,
  RIHLA_PRECACHE: { version: "test", assets: ["/_next/app.js"] },
  location: { origin },
  clients: { async claim() { claimed = true; } },
  skipWaiting() { skipped = true; },
  addEventListener(name, handler) { handlers.set(name, handler); },
};
runInNewContext(await readFile(new URL("../public/sw.js", import.meta.url), "utf8"), {
  self: scope, importScripts() {}, caches: cacheStorage, Request: OriginRequest, Response, URL,
  fetch: async (request) => {
    network.push(request.url);
    if (offlineNetwork) throw new TypeError("Network unavailable");
    return new Response("network");
  },
});
async function lifecycle(name) {
  let completion;
  handlers.get(name)({ waitUntil(promise) { completion = promise; } });
  await completion;
}
async function fetchEvent(request) {
  let result;
  handlers.get("fetch")({ request, respondWith(response) { result = response; } });
  return result;
}
await lifecycle("install");
const shell = await cacheStorage.open("rihla-shell-test");
assert.equal(shell.entries.size, 2);
assert.deepEqual([...shell.entries.keys()], [origin + "/", origin + "/_next/app.js"]);
const media = await cacheStorage.open(worker.mediaCache);
media.entries.set("https://archive.org/test.mp3", response());
await cacheStorage.open("rihla-shell-old");
await cacheStorage.open("other-app");
await lifecycle("activate");
assert.equal(claimed, true);
assert.equal(buckets.has("rihla-shell-old"), false);
assert.equal(buckets.has("other-app"), true);
assert.equal(buckets.has(worker.mediaCache), true);
offlineNetwork = true;
const document = await fetchEvent({ method: "GET", mode: "navigate", url: origin + "/content/pickthall-al-fatiha-audio" });
assert.equal(await document.text(), origin + "/");
const asset = await fetchEvent(new Request(origin + "/_next/app.js"));
assert.equal(await asset.text(), origin + "/_next/app.js");
const audio = await fetchEvent(new Request("https://archive.org/test.mp3", { headers: { range: "bytes=2-" } }));
assert.equal(audio.status, 206);
assert.deepEqual([...new Uint8Array(await audio.arrayBuffer())], [3, 4, 5]);
for (const url of ["/api/quran/surahs", "/auth/callback?code=secret", "/?_rsc=secret"]) {
  assert.equal(await fetchEvent(new Request(origin + url)), undefined, "API/RSC must bypass service worker caching");
}
assert.equal(await fetchEvent(new Request(origin + "/api/library", { method: "POST" })), undefined);
assert.equal(await fetchEvent({ method: "GET", mode: "navigate", url: origin + "/admin" }), undefined);
handlers.get("message")({ data: { type: "SKIP_WAITING" } });
assert.equal(skipped, true);
assert.equal(network.length, 1, "Only the public navigation tried the network");
console.log("Offline worker: installation, isolated cleanup, navigation, asset and audio fallback, update lifecycle passed.");
