import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The app modules use the `@/` alias, so this script bundles the real sources
 * with esbuild and exercises them instead of duplicating logic here.
 */
async function loadSources() {
  const result = await build({
    stdin: {
      contents: [
        'export * from "@/lib/offline-storage";',
        'export * from "@/lib/offline";',
        'export * from "@/lib/download-types";',
      ].join("\n"),
      resolveDir: repoRoot,
      sourcefile: "verify-downloads-entry.ts",
      loader: "ts",
    },
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    alias: { "@": repoRoot },
    logLevel: "silent",
  });
  const directory = await mkdtemp(path.join(tmpdir(), "rihla-downloads-"));
  const bundlePath = path.join(directory, "downloads.mjs");
  await writeFile(bundlePath, result.outputFiles[0].text, "utf8");
  return import(pathToFileURL(bundlePath).href);
}

const sources = await loadSources();
const {
  createOfflineDownloadStore,
  validateDownloadResponse,
  CACHE_NAME,
  DOWNLOAD_REGISTRY_KEY,
  OFFLINE_MEDIA_CACHE,
  canDownloadOffline,
  canPersistOfflineDownload,
  downloadRecordId,
  isQuranFoundationUrl,
  offlineUrlDecision,
  reconcileDownloads,
  recoverInterruptedDownloads,
  resolveDownloadTarget,
} = sources;

const checks = [];
function check(name, run) {
  checks.push({ name, run });
}

/* ------------------------------------------------------------------ fixtures */

const AUDIO_BYTES = new Uint8Array(Array.from({ length: 64 }, (_, index) => index + 1));
const AUDIO_SHA1 = [...new Uint8Array(await crypto.subtle.digest("SHA-1", AUDIO_BYTES))]
  .map((value) => value.toString(16).padStart(2, "0"))
  .join("");
const AUDIO_URL = "https://archive.example.test/fixture/lesson-01.mp3";
const HIGH_URL = "https://archive.example.test/fixture/lesson-01-high.mp3";

function rightsRecord(overrides = {}) {
  return {
    id: "rights-fixture",
    sourceId: "source-fixture",
    verification: "HUMAN_VERIFIED",
    capabilities: {
      displayMetadata: "YES",
      embed: "YES",
      streamRemote: "YES",
      hostCopy: "YES",
      downloadOffline: "YES",
      transcribe: "UNKNOWN",
      translate: "UNKNOWN",
      createChapters: "UNKNOWN",
      createClips: "UNKNOWN",
      modify: "NO",
      commercialUse: "YES",
    },
    ...overrides,
  };
}

function mediaAsset(overrides = {}) {
  return {
    id: "media-fixture",
    kind: "AUDIO",
    url: AUDIO_URL,
    durationMs: 1000,
    sourceId: "source-fixture",
    rightsRecordId: "rights-fixture",
    mimeType: "audio/mpeg",
    sizeBytes: AUDIO_BYTES.byteLength,
    checksumSha1: AUDIO_SHA1,
    variantIds: ["variant-fixture-standard"],
    ...overrides,
  };
}

function variants() {
  return [
    { id: "variant-fixture-standard", mediaAssetId: "media-fixture", kind: "AUDIO", url: AUDIO_URL, quality: "STANDARD", mimeType: "audio/mpeg", sizeBytes: AUDIO_BYTES.byteLength, checksumSha1: AUDIO_SHA1 },
    { id: "variant-fixture-high", mediaAssetId: "media-fixture", kind: "AUDIO", url: HIGH_URL, quality: "HIGH", mimeType: "audio/mpeg", sizeBytes: 128, checksumSha1: "ffffffffffffffffffffffffffffffffffffffff" },
  ];
}

function mockCacheStorage() {
  const buckets = new Map();
  const deletes = [];
  const puts = [];
  return {
    deletes,
    puts,
    storage: {
      async open(name) {
        if (!buckets.has(name)) buckets.set(name, new Map());
        const bucket = buckets.get(name);
        return {
          async put(request, response) {
            puts.push({ name, request });
            bucket.set(request, response);
          },
          async match(request) {
            return bucket.get(request);
          },
          async delete(request) {
            deletes.push({ name, request });
            return bucket.delete(request);
          },
          async keys() {
            return [...bucket.keys()];
          },
        };
      },
    },
  };
}

function mockStorage() {
  const data = new Map();
  let failWrites = false;
  return {
    data,
    setFailWrites(value) { failWrites = value; },
    storage: {
      getItem: (key) => (data.has(key) ? data.get(key) : null),
      setItem: (key, value) => {
        if (failWrites) {
          const error = new Error("Quota exceeded");
          error.name = "QuotaExceededError";
          throw error;
        }
        data.set(key, value);
      },
      removeItem: (key) => { data.delete(key); },
    },
  };
}

function streamingResponse({ chunks = [AUDIO_BYTES], headers = {}, status = 200, type } = {}) {
  const body = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
  const response = new Response(body, {
    status,
    headers: { "content-type": "audio/mpeg", "content-length": String(AUDIO_BYTES.byteLength), ...headers },
  });
  if (type) Object.defineProperty(response, "type", { value: type });
  return response;
}

function makeEnv({ fetchImpl, cache = mockCacheStorage(), storage = mockStorage(), estimate } = {}) {
  return {
    caches: cache.storage,
    storage: storage.storage,
    fetch: fetchImpl ?? (async () => streamingResponse()),
    estimate,
  };
}

/** The store takes the environment under `env`, never as the options object. */
function makeStore(options = {}, storeOptions = {}) {
  return createOfflineDownloadStore({ env: makeEnv(options), ...storeOptions });
}

const downloadRequest = (overrides = {}) => ({
  content: { id: "content-fixture", title: "Fixture" },
  asset: mediaAsset(),
  variants: variants(),
  rights: [rightsRecord()],
  ...overrides,
});

/* ------------------------------------------------------------- rights gating */

check("strict offline gate requires verified rights plus hostCopy/downloadOffline", () => {
  assert.equal(canDownloadOffline(mediaAsset(), [rightsRecord()]), true);
  assert.equal(canPersistOfflineDownload(mediaAsset(), [rightsRecord()]).allowed, true);
  assert.equal(canPersistOfflineDownload(mediaAsset(), [rightsRecord({ revokedAt: "2026-01-01T00:00:00.000Z" })]).reason, "RIGHTS_REVOKED");
  assert.equal(canPersistOfflineDownload(mediaAsset(), [rightsRecord({ verification: "AUTO_DETECTED" })]).reason, "RIGHTS_FORBIDDEN");
  assert.equal(canPersistOfflineDownload(mediaAsset(), [rightsRecord({ verification: "UNVERIFIED" })]).reason, "RIGHTS_FORBIDDEN");
  const noHost = rightsRecord();
  noHost.capabilities = { ...noHost.capabilities, hostCopy: "NO" };
  assert.equal(canPersistOfflineDownload(mediaAsset(), [noHost]).reason, "RIGHTS_FORBIDDEN");
  const noOffline = rightsRecord();
  noOffline.capabilities = { ...noOffline.capabilities, downloadOffline: "NO" };
  assert.equal(canPersistOfflineDownload(mediaAsset(), [noOffline]).reason, "RIGHTS_FORBIDDEN");
  assert.equal(canPersistOfflineDownload(mediaAsset(), []).reason, "RIGHTS_MISSING");
  assert.equal(canDownloadOffline(mediaAsset(), [rightsRecord({ verification: "AUTO_DETECTED" })]), false);
  // Delegation: the permissive legacy helper must match the strict gate.
  assert.equal(canDownloadOffline(mediaAsset(), [noHost]), false);
});

check("Quran Foundation sources and the resolved variant URL are refused", () => {
  const quran = mediaAsset({ url: "https://verses.quran.foundation/audio/001.mp3" });
  assert.equal(isQuranFoundationUrl(quran.url), true);
  assert.equal(isQuranFoundationUrl("https://api.quran.com/api/v4/verses"), true);
  assert.equal(canPersistOfflineDownload(quran, [rightsRecord()]).reason, "QURAN_FOUNDATION_BLOCKED");
  assert.equal(canPersistOfflineDownload(mediaAsset({ url: "not-a-url" }), [rightsRecord()]).reason, "URL_INVALID");
  assert.equal(offlineUrlDecision(AUDIO_URL), null);
  assert.equal(offlineUrlDecision("https://verses.quran.foundation/a.mp3"), "QURAN_FOUNDATION_BLOCKED");
});

/* ---------------------------------------------------------- quality selection */

check("quality resolves by exact mediaAssetId and keeps integrity per URL", () => {
  const asset = mediaAsset();
  const standard = resolveDownloadTarget(asset, variants(), "STANDARD");
  assert.equal(standard.url, AUDIO_URL);
  assert.equal(standard.variantId, "variant-fixture-standard");
  assert.equal(standard.checksum, AUDIO_SHA1);

  const high = resolveDownloadTarget(asset, variants(), "high");
  assert.equal(high.url, HIGH_URL);
  assert.equal(high.quality, "HIGH");
  assert.equal(high.checksum, "ffffffffffffffffffffffffffffffffffffffff");

  // A variant pointing at another URL must not inherit asset-level integrity.
  const foreign = resolveDownloadTarget(mediaAsset(), [
    { id: "variant-other", mediaAssetId: "media-fixture", kind: "AUDIO", url: "https://elsewhere.test/other.mp3", quality: "STANDARD" },
  ], "STANDARD");
  assert.equal(foreign.url, "https://elsewhere.test/other.mp3");
  assert.equal(foreign.checksum, null);
  assert.equal(foreign.sizeBytes, null);

  assert.equal(resolveDownloadTarget(asset, variants(), "DATA_SAVER").url, AUDIO_URL);
  assert.equal(resolveDownloadTarget(asset, [], "HIGH").url, AUDIO_URL);
  assert.equal(downloadRecordId("content-fixture", "media-fixture", "data-saver"), "content-fixture:media-fixture:DATA_SAVER");
});

/* -------------------------------------------------------------- reconciling */

function availableRecord(overrides = {}) {
  return {
    id: "content-fixture:media-fixture:STANDARD",
    contentId: "content-fixture",
    mediaAssetId: "media-fixture",
    variantId: "variant-fixture-standard",
    title: "Fixture",
    url: AUDIO_URL,
    quality: "STANDARD",
    checksum: AUDIO_SHA1,
    rightsRecordId: "rights-fixture",
    status: "AVAILABLE",
    receivedBytes: AUDIO_BYTES.byteLength,
    totalBytes: AUDIO_BYTES.byteLength,
    sizeBytes: AUDIO_BYTES.byteLength,
    timestamp: 1,
    updatedAt: 1,
    error: null,
    ...overrides,
  };
}

const catalogContext = { assets: [mediaAsset()], rights: [rightsRecord()], variants: variants(), contentIds: ["content-fixture"] };

check("purged cache becomes MISSING", () => {
  const report = reconcileDownloads([availableRecord()], { ...catalogContext, cachedUrls: [] });
  assert.equal(report.records[0].status, "MISSING");
  assert.deepEqual(report.removedOrphans, []);
});

check("revoked, unverified, downgraded, missing rights, removed assets and contents purge the cache", () => {
  const revoked = reconcileDownloads([availableRecord()], {
    ...catalogContext,
    cachedUrls: [AUDIO_URL],
    rights: [rightsRecord({ revokedAt: "2026-01-01T00:00:00.000Z" })],
  });
  assert.equal(revoked.records[0].status, "CANCELLED");
  assert.deepEqual(revoked.purgedUrls, [AUDIO_URL]);
  assert.equal(revoked.purged[0].reason, "RIGHTS_REVOKED");
  assert.equal(revoked.purged[0].cachePurged, true);

  const unverified = reconcileDownloads([availableRecord()], { ...catalogContext, cachedUrls: [AUDIO_URL], rights: [rightsRecord({ verification: "AUTO_DETECTED" })] });
  assert.equal(unverified.purged[0].reason, "RIGHTS_FORBIDDEN");

  const noHostCopy = rightsRecord();
  noHostCopy.capabilities = { ...noHostCopy.capabilities, hostCopy: "NO" };
  const downgraded = reconcileDownloads([availableRecord()], { ...catalogContext, cachedUrls: [AUDIO_URL], rights: [noHostCopy] });
  assert.equal(downgraded.purged[0].reason, "RIGHTS_FORBIDDEN");

  const noOffline = rightsRecord();
  noOffline.capabilities = { ...noOffline.capabilities, downloadOffline: "NO" };
  const offlineDowngraded = reconcileDownloads([availableRecord()], { ...catalogContext, cachedUrls: [AUDIO_URL], rights: [noOffline] });
  assert.equal(offlineDowngraded.purged[0].reason, "RIGHTS_FORBIDDEN");

  const missingRights = reconcileDownloads([availableRecord()], { ...catalogContext, cachedUrls: [AUDIO_URL], rights: [] });
  assert.equal(missingRights.purged[0].reason, "RIGHTS_MISSING");

  const removedAsset = reconcileDownloads([availableRecord()], { ...catalogContext, cachedUrls: [AUDIO_URL], assets: [] });
  assert.equal(removedAsset.purged[0].reason, "ASSET_REMOVED");

  const removedContent = reconcileDownloads([availableRecord()], { ...catalogContext, cachedUrls: [AUDIO_URL], contentIds: [] });
  assert.equal(removedContent.purged[0].reason, "CONTENT_REMOVED");
  assert.equal(removedContent.records[0].status, "CANCELLED");
});

check("revoked record stays CANCELLED even when a sibling keeps the same URL", () => {
  const revokedSibling = availableRecord({ id: "content-fixture:media-fixture:HIGH", quality: "HIGH", variantId: "variant-fixture-high" });
  const report = reconcileDownloads([availableRecord(), revokedSibling], {
    ...catalogContext,
    cachedUrls: [AUDIO_URL],
    rights: [rightsRecord({ revokedAt: "2026-01-01T00:00:00.000Z" })],
  });
  assert.equal(report.records[0].status, "CANCELLED");
  assert.equal(report.records[1].status, "CANCELLED");
  // Nothing is revived to AVAILABLE by the healthy sibling.
  assert.equal(report.records.some((record) => record.status === "AVAILABLE"), false);
});

check("changed source or checksum marks STALE and orphan cache entries are reported", () => {
  const movedSource = reconcileDownloads([availableRecord()], {
    ...catalogContext,
    cachedUrls: [AUDIO_URL],
    variants: [{ id: "variant-fixture-standard", mediaAssetId: "media-fixture", kind: "AUDIO", url: "https://archive.example.test/fixture/lesson-01-v2.mp3", quality: "STANDARD", checksumSha1: AUDIO_SHA1 }],
  });
  assert.equal(movedSource.records[0].status, "STALE");
  assert.deepEqual(movedSource.purgedUrls, []);

  const movedChecksum = reconcileDownloads([availableRecord()], {
    ...catalogContext,
    cachedUrls: [AUDIO_URL],
    variants: [{ id: "variant-fixture-standard", mediaAssetId: "media-fixture", kind: "AUDIO", url: AUDIO_URL, quality: "STANDARD", checksumSha1: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }],
  });
  assert.equal(movedChecksum.records[0].status, "STALE");

  const orphan = reconcileDownloads([availableRecord()], { ...catalogContext, cachedUrls: [AUDIO_URL, "https://orphan.test/leftover.mp3"] });
  assert.deepEqual(orphan.removedOrphans, ["https://orphan.test/leftover.mp3"]);
});

check("interrupted DOWNLOADING records recover to ERROR without touching live ones", () => {
  const downloading = availableRecord({ status: "DOWNLOADING", receivedBytes: 12, sizeBytes: null });
  assert.equal(recoverInterruptedDownloads([downloading], [])[0].status, "ERROR");
  assert.equal(recoverInterruptedDownloads([downloading], [downloading.id])[0].status, "DOWNLOADING");
});

/* ---------------------------------------------------------- response guards */

check("opaque, partial and non-media responses are rejected", () => {
  assert.equal(validateDownloadResponse(streamingResponse()).ok, true);
  assert.equal(validateDownloadResponse(streamingResponse({ type: "opaque" })).ok, false);
  assert.equal(validateDownloadResponse(streamingResponse({ status: 206 })).ok, false);
  assert.equal(validateDownloadResponse(streamingResponse({ headers: { "content-type": "text/html" } })).ok, false);
  assert.equal(validateDownloadResponse(streamingResponse({ headers: { "content-type": "video/mp4" } }), "audio/mpeg").ok, false);
  assert.equal(validateDownloadResponse(streamingResponse({ headers: { "content-type": "audio/mpeg" } }), "audio/mpeg").ok, true);
});

/* ------------------------------------------------------------ store pipeline */

check("download streams progress into the shared cache and persists the registry", async () => {
  const cache = mockCacheStorage();
  const storage = mockStorage();
  const store = makeStore({ cache, storage });
  const progress = [];
  store.subscribe((records) => progress.push(records[0]?.receivedBytes ?? 0));

  const result = await store.download(downloadRequest());

  assert.equal(result.ok, true);
  assert.equal(result.record.status, "AVAILABLE");
  assert.equal(result.record.receivedBytes, AUDIO_BYTES.byteLength);
  assert.equal(result.record.sizeBytes, AUDIO_BYTES.byteLength);
  assert.equal(result.record.quality, "STANDARD");
  assert.equal(result.record.title, "Fixture");
  assert.equal(result.record.url, AUDIO_URL);
  assert.equal(result.record.checksum, AUDIO_SHA1);
  assert.ok(progress.length >= 1);
  assert.deepEqual(cache.puts.map((entry) => entry.name), [OFFLINE_MEDIA_CACHE]);
  assert.equal(cache.puts[0].request, AUDIO_URL);
  assert.equal(CACHE_NAME, OFFLINE_MEDIA_CACHE);

  const persisted = JSON.parse(storage.data.get(DOWNLOAD_REGISTRY_KEY));
  assert.equal(persisted.records.length, 1);
  assert.equal(persisted.records[0].status, "AVAILABLE");
  assert.equal(storage.data.get(DOWNLOAD_REGISTRY_KEY).includes("rightsRecordId"), true);

  const again = await store.download(downloadRequest());
  assert.equal(again.ok, true);
  assert.equal(again.reason, "ALREADY_DOWNLOADED");
  assert.equal(cache.puts.length, 1);
});

check("an AVAILABLE record with a mismatching cached checksum is refetched", async () => {
  const cache = mockCacheStorage();
  const store = makeStore({ cache });
  await store.download(downloadRequest());
  const bucket = await cache.storage.open(OFFLINE_MEDIA_CACHE);
  await bucket.put(AUDIO_URL, new Response(new Uint8Array([9, 9, 9]), { headers: { "content-type": "audio/mpeg" } }));

  const refetched = await store.download(downloadRequest());
  assert.equal(refetched.ok, true);
  // One store write for the refetch, on top of the initial download and the
  // corrupted entry injected by the test itself.
  assert.equal(cache.puts.filter((entry) => entry.request === AUDIO_URL).length, 3);
  assert.equal(refetched.record.status, "AVAILABLE");
});

check("blocked downloads never touch the cache", async () => {
  const cache = mockCacheStorage();
  let fetches = 0;
  const store = makeStore({ cache, fetchImpl: async () => { fetches += 1; return streamingResponse(); } });

  const forbidden = await store.download(downloadRequest({ rights: [] }));
  assert.equal(forbidden.ok, false);
  assert.equal(forbidden.reason, "RIGHTS_MISSING");

  const quran = await store.download(downloadRequest({ content: { id: "content-quran", title: "Ayah" }, asset: mediaAsset({ url: "https://verses.quran.foundation/audio/001.mp3" }) }));
  assert.equal(quran.reason, "QURAN_FOUNDATION_BLOCKED");
  assert.equal(fetches, 0);
  assert.equal(cache.puts.length, 0);
});

check("a blocked variant URL is refused before fetch", async () => {
  const cache = mockCacheStorage();
  let fetches = 0;
  const store = makeStore({ cache, fetchImpl: async () => { fetches += 1; return streamingResponse(); } });
  const result = await store.download(downloadRequest({
    variants: [{ id: "variant-evil", mediaAssetId: "media-fixture", kind: "AUDIO", url: "https://verses.quran.foundation/audio/001.mp3", quality: "STANDARD" }],
  }));
  assert.equal(result.ok, false);
  assert.equal(result.reason, "QURAN_FOUNDATION_BLOCKED");
  assert.equal(fetches, 0);
  assert.equal(cache.puts.length, 0);
});

check("checksum mismatch is rejected and nothing is cached", async () => {
  const cache = mockCacheStorage();
  const store = makeStore({ cache });
  const result = await store.download(downloadRequest({ asset: mediaAsset({ checksumSha1: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" }), variants: [] }));
  assert.equal(result.ok, false);
  assert.equal(result.reason, "CHECKSUM_MISMATCH");
  assert.equal(cache.puts.length, 0);
  assert.equal(store.snapshot()[0].status, "ERROR");
});

check("quota is preflighted and runtime QuotaExceededError is typed", async () => {
  const tight = makeStore({ estimate: async () => ({ usage: 900, quota: 1000, available: 10 }) });
  const blocked = await tight.download(downloadRequest());
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, "QUOTA_EXCEEDED");

  const cache = mockCacheStorage();
  const failingPut = {
    storage: {
      async open() {
        return {
          async put() {
            const error = new Error("Quota exceeded");
            error.name = "QuotaExceededError";
            throw error;
          },
          async match() { return undefined; },
          async delete() { return false; },
          async keys() { return []; },
        };
      },
    },
  };
  const store = createOfflineDownloadStore({
    env: { caches: failingPut.storage, storage: mockStorage().storage, fetch: async () => streamingResponse() },
  });
  const result = await store.download(downloadRequest());
  assert.equal(result.ok, false);
  assert.equal(result.reason, "QUOTA_EXCEEDED");
  assert.equal(store.snapshot()[0].status, "ERROR");
  assert.equal(cache.puts.length, 0);
});

check("a registry write failure is reported instead of silently claiming success", async () => {
  const storage = mockStorage();
  storage.setFailWrites(true);
  const store = makeStore({ storage });
  const result = await store.download(downloadRequest());
  assert.equal(result.ok, true);
  assert.equal(result.record.status, "AVAILABLE");
  assert.match(result.message, /stockage/i);
  assert.equal(storage.data.has(DOWNLOAD_REGISTRY_KEY), false);
});

check("abort marks CANCELLED and retry recovers to AVAILABLE", async () => {
  const cache = mockCacheStorage();
  let attempt = 0;
  const hangingFetch = (url, init) => {
    attempt += 1;
    if (attempt === 1) {
      return new Promise((resolve, reject) => {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(AUDIO_BYTES.slice(0, 16));
            init?.signal?.addEventListener("abort", () => {
              const error = new Error("Aborted");
              error.name = "AbortError";
              controller.error(error);
              reject(error);
            });
          },
        });
        resolve(new Response(stream, { status: 200, headers: { "content-type": "audio/mpeg", "content-length": String(AUDIO_BYTES.byteLength) } }));
      });
    }
    return Promise.resolve(streamingResponse());
  };
  const store = makeStore({ cache, fetchImpl: hangingFetch });
  const pending = store.download(downloadRequest());
  await new Promise((resolve) => setTimeout(resolve, 10));
  const cancelled = await store.cancel("content-fixture:media-fixture:STANDARD");
  assert.equal(cancelled.status, "CANCELLED");
  const settled = await pending;
  assert.equal(settled.ok, false);
  assert.equal(settled.record.status, "CANCELLED");

  const retried = await store.retry("content-fixture:media-fixture:STANDARD", { rights: [rightsRecord()], variants: variants(), asset: mediaAsset() });
  assert.equal(retried.ok, true);
  assert.equal(retried.record.status, "AVAILABLE");
  assert.equal(cache.puts.length, 1);
});

check("cancel during cache.put wins and removes the written entry", async () => {
  const cache = mockCacheStorage();
  let resolvePut;
  const gatedPut = {
    storage: {
      async open(name) {
        const bucket = new Map();
        return {
          async put(request, response) {
            await new Promise((resolve) => { resolvePut = resolve; });
            cache.puts.push({ name, request });
            bucket.set(request, response);
          },
          async match(request) { return bucket.get(request); },
          async delete(request) { cache.deletes.push({ name, request }); return bucket.delete(request); },
          async keys() { return [...bucket.keys()]; },
        };
      },
    },
  };
  const store = createOfflineDownloadStore({
    env: { caches: gatedPut.storage, storage: mockStorage().storage, fetch: async () => streamingResponse() },
  });
  const pending = store.download(downloadRequest());
  await new Promise((resolve) => setTimeout(resolve, 20));
  const cancelled = await store.cancel("content-fixture:media-fixture:STANDARD");
  assert.equal(cancelled.status, "CANCELLED");
  resolvePut();
  const settled = await pending;
  assert.equal(settled.ok, false);
  assert.equal(settled.record.status, "CANCELLED");
  assert.deepEqual(cache.deletes.map((entry) => entry.request), [AUDIO_URL]);
  assert.equal(store.snapshot()[0].status, "CANCELLED");
});

check("remove deletes the cache entry and the registry row", async () => {
  const cache = mockCacheStorage();
  const storage = mockStorage();
  const store = makeStore({ cache, storage });
  await store.download(downloadRequest());
  const id = "content-fixture:media-fixture:STANDARD";
  assert.equal(await store.remove(id), true);
  assert.deepEqual(cache.deletes.map((entry) => entry.request), [AUDIO_URL]);
  assert.equal(cache.deletes[0].name, OFFLINE_MEDIA_CACHE);
  assert.equal(store.snapshot().length, 0);
  assert.equal(JSON.parse(storage.data.get(DOWNLOAD_REGISTRY_KEY)).records.length, 0);
  assert.equal(await store.remove(id), false);
});

check("a late abort cannot resurrect a removed record", async () => {
  const cache = mockCacheStorage();
  const storage = mockStorage();
  const hangingFetch = (url, init) => new Promise((resolve, reject) => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(AUDIO_BYTES.slice(0, 8));
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("Aborted");
          error.name = "AbortError";
          controller.error(error);
          reject(error);
        });
      },
    });
    resolve(new Response(stream, { status: 200, headers: { "content-type": "audio/mpeg" } }));
  });
  const store = makeStore({ cache, storage, fetchImpl: hangingFetch });
  const pending = store.download(downloadRequest());
  await new Promise((resolve) => setTimeout(resolve, 10));
  const id = "content-fixture:media-fixture:STANDARD";
  assert.equal(await store.remove(id), true);
  await pending;
  assert.equal(store.snapshot().length, 0);
  assert.equal(JSON.parse(storage.data.get(DOWNLOAD_REGISTRY_KEY)).records.length, 0);
});

check("a stale attempt cannot overwrite a newer retry", async () => {
  const cache = mockCacheStorage();
  let call = 0;
  let releaseFirst;
  const racingFetch = () => {
    call += 1;
    if (call === 1) {
      return new Promise((resolve) => {
        releaseFirst = () => resolve(streamingResponse({ chunks: [AUDIO_BYTES] }));
      });
    }
    return Promise.resolve(streamingResponse({ chunks: [AUDIO_BYTES] }));
  };
  const store = makeStore({ cache, fetchImpl: racingFetch });
  const first = store.download(downloadRequest());
  await new Promise((resolve) => setTimeout(resolve, 10));
  await store.cancel("content-fixture:media-fixture:STANDARD");
  const second = store.download(downloadRequest());
  const secondResult = await second;
  assert.equal(secondResult.ok, true);
  assert.equal(secondResult.record.status, "AVAILABLE");

  releaseFirst();
  const firstResult = await first;
  assert.equal(firstResult.ok, false);
  assert.equal(store.snapshot()[0].status, "AVAILABLE");
});

check("reload recovers interrupted metadata as ERROR without clobbering an active download", async () => {
  const cache = mockCacheStorage();
  const storage = mockStorage();
  const hangingFetch = (url, init) => new Promise((resolve, reject) => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(AUDIO_BYTES.slice(0, 8));
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("Aborted");
          error.name = "AbortError";
          controller.error(error);
          reject(error);
        });
      },
    });
    resolve(new Response(stream, { status: 200, headers: { "content-type": "audio/mpeg" } }));
  });
  const first = makeStore({ cache, storage, fetchImpl: hangingFetch });
  const pending = first.download(downloadRequest());
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(JSON.parse(storage.data.get(DOWNLOAD_REGISTRY_KEY)).records[0].status, "DOWNLOADING");

  // Same session: the live attempt keeps the record DOWNLOADING.
  assert.equal(first.load()[0].status, "DOWNLOADING");

  // Fresh session (reload): no in-flight attempt, so the leftover becomes ERROR.
  const reloaded = makeStore({ cache, storage });
  assert.equal(reloaded.load()[0].status, "ERROR");
  assert.equal(reloaded.snapshot()[0].error, "Téléchargement interrompu.");

  await first.cancel("content-fixture:media-fixture:STANDARD");
  await pending;
});

check("reconcile cleans orphan cache entries through the store and reports quota", async () => {
  const cache = mockCacheStorage();
  const storage = mockStorage();
  const store = makeStore({ cache, storage });
  await store.download(downloadRequest());
  const bucket = await cache.storage.open(OFFLINE_MEDIA_CACHE);
  await bucket.put("https://orphan.test/leftover.mp3", new Response("x"));

  const report = await store.reconcile(catalogContext);
  assert.deepEqual(report.removedOrphans, ["https://orphan.test/leftover.mp3"]);
  assert.equal(report.records[0].status, "AVAILABLE");
  assert.deepEqual(cache.deletes.map((entry) => entry.request), ["https://orphan.test/leftover.mp3"]);

  const revokedReport = await store.reconcile({ ...catalogContext, rights: [rightsRecord({ revokedAt: "2026-01-01T00:00:00.000Z" })] });
  assert.equal(revokedReport.records[0].status, "CANCELLED");
  assert.equal(cache.deletes.at(-1).request, AUDIO_URL);
  assert.equal(await bucket.match(AUDIO_URL), undefined);

  const quotaStore = makeStore({ estimate: async () => ({ usage: 100, quota: 1000, available: 900 }) });
  assert.deepEqual(await quotaStore.storageEstimate(), { usage: 100, quota: 1000, available: 900 });
  assert.deepEqual(await makeStore().storageEstimate(), { usage: 0, quota: null, available: null });
});

check("a store without Cache Storage reports STORAGE_UNAVAILABLE instead of throwing", async () => {
  const store = createOfflineDownloadStore({ storage: mockStorage().storage, fetch: async () => streamingResponse() });
  assert.equal(store.isSupported, false);
  const result = await store.download(downloadRequest());
  assert.equal(result.ok, false);
  assert.equal(result.reason, "STORAGE_UNAVAILABLE");
});

check("the store never touches browser storage before an operation", () => {
  const originalWindow = globalThis.window;
  const originalNavigator = globalThis.navigator;
  try {
    // Simulate SSR: no window/navigator at construction time.
    delete globalThis.window;
    Object.defineProperty(globalThis, "navigator", { value: undefined, configurable: true });
    const store = createOfflineDownloadStore();
    assert.equal(store.isSupported, false);
    assert.deepEqual(store.snapshot(), []);
  } finally {
    if (originalWindow !== undefined) globalThis.window = originalWindow;
    Object.defineProperty(globalThis, "navigator", { value: originalNavigator, configurable: true });
  }
});

check("registry tolerates corrupted payloads", () => {
  const storage = mockStorage();
  storage.storage.setItem(DOWNLOAD_REGISTRY_KEY, "{not json");
  const store = createOfflineDownloadStore({ storage: storage.storage, caches: mockCacheStorage().storage, fetch: async () => streamingResponse() });
  assert.deepEqual(store.load(), []);
});

/* ------------------------------------------------------------------- runner */

let failures = 0;
for (const { name, run } of checks) {
  try {
    await run();
    console.log(`ok   ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

if (failures > 0) {
  console.error(`\n${failures} download check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`\nDownloads: ${checks.length} checks OK (cache ${OFFLINE_MEDIA_CACHE}).`);
}
