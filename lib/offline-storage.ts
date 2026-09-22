import type { MediaAsset, MediaVariant, RightsRecord } from "@/lib/domain";
import {
  DOWNLOAD_REGISTRY_KEY,
  OFFLINE_MEDIA_CACHE,
  type DownloadAttemptResult,
  type DownloadQualityInput,
  type DownloadRecord,
  type DownloadReconcileReport,
  type DownloadRequest,
  type OfflineCacheLike,
  type OfflineCacheStorageLike,
  type OfflineRegistryStorageLike,
  type OfflineStorageEnv,
  type StorageEstimate,
} from "@/lib/download-types";
import {
  canPersistOfflineDownload,
  downloadRecordId,
  normalizeDownloadQuality,
  offlineUrlDecision,
  recoverInterruptedDownloads,
  reconcileDownloads,
  resolveDownloadTarget,
} from "@/lib/offline";

/** Cache Storage bucket the app service worker reads from. */
export const CACHE_NAME = OFFLINE_MEDIA_CACHE;
export { DOWNLOAD_REGISTRY_KEY };

function safeLocalStorage(): OfflineRegistryStorageLike | undefined {
  try {
    const storage = window.localStorage;
    // Private modes throw on write: probe before trusting the handle.
    const probe = `${DOWNLOAD_REGISTRY_KEY}.probe`;
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return undefined;
  }
}

function browserEnv(): OfflineStorageEnv {
  if (typeof window === "undefined") return {};
  const storage = safeLocalStorage();
  const estimate = typeof navigator !== "undefined" && navigator.storage?.estimate
    ? async () => {
        const result = await navigator.storage.estimate();
        const quota = typeof result.quota === "number" ? result.quota : null;
        const usage = typeof result.usage === "number" ? result.usage : 0;
        return { usage, quota, available: quota === null ? null : Math.max(0, quota - usage) };
      }
    : undefined;
  return {
    caches: "caches" in window ? (window.caches as unknown as OfflineCacheStorageLike) : undefined,
    storage,
    // `fetch` must keep its `window` receiver: calling a bare reference throws
    // "Illegal invocation" in browsers.
    fetch: typeof window.fetch === "function" ? window.fetch.bind(window) : undefined,
    estimate,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isKnownStatus(value: string): value is DownloadRecord["status"] {
  return ["DOWNLOADING", "AVAILABLE", "ERROR", "CANCELLED", "STALE", "MISSING"].includes(value);
}

/** Defensive parse: a corrupted registry must never break the library screen. */
function parseRegistry(raw: string | null): DownloadRecord[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const list = Array.isArray(parsed) ? parsed : isRecord(parsed) && Array.isArray(parsed.records) ? parsed.records : [];
  return list.filter(isRecord).flatMap((entry) => {
    const id = typeof entry.id === "string" ? entry.id : null;
    const contentId = typeof entry.contentId === "string" ? entry.contentId : null;
    const mediaAssetId = typeof entry.mediaAssetId === "string" ? entry.mediaAssetId : null;
    const url = typeof entry.url === "string" ? entry.url : null;
    if (!id || !contentId || !mediaAssetId || !url) return [];
    const status = typeof entry.status === "string" && isKnownStatus(entry.status) ? entry.status : "ERROR";
    return [{
      id,
      contentId,
      mediaAssetId,
      variantId: typeof entry.variantId === "string" ? entry.variantId : undefined,
      title: typeof entry.title === "string" ? entry.title : "Téléchargement",
      url,
      quality: normalizeDownloadQuality(typeof entry.quality === "string" ? (entry.quality as DownloadQualityInput) : undefined),
      checksum: typeof entry.checksum === "string" ? entry.checksum : null,
      rightsRecordId: typeof entry.rightsRecordId === "string" ? entry.rightsRecordId : "",
      status,
      receivedBytes: numberOrNull(entry.receivedBytes) ?? 0,
      totalBytes: numberOrNull(entry.totalBytes),
      sizeBytes: numberOrNull(entry.sizeBytes),
      timestamp: numberOrNull(entry.timestamp) ?? Date.now(),
      updatedAt: numberOrNull(entry.updatedAt) ?? Date.now(),
      error: typeof entry.error === "string" ? entry.error : null,
    }];
  });
}

function cacheUrl(entry: Request | string) {
  return typeof entry === "string" ? entry : entry.url;
}

function readContentLength(response: Response) {
  const header = response.headers?.get("content-length");
  const parsed = header ? Number(header) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function estimateFromEnv(env: OfflineStorageEnv): Promise<StorageEstimate> {
  const fallback: StorageEstimate = { usage: 0, quota: null, available: null };
  if (!env.estimate) return Promise.resolve(fallback);
  return env.estimate().catch(() => fallback);
}

/**
 * Buffers the response while reporting stream progress, so the body can be
 * checksum-verified before it is written to Cache Storage.
 */
async function bufferResponseWithProgress(
  response: Response,
  onProgress: (receivedBytes: number, totalBytes: number | null) => void,
): Promise<{ response: Response; bytes: number; totalBytes: number | null }> {
  const headerLength = readContentLength(response);
  const body = response.body;
  if (!body) {
    const buffer = await response.arrayBuffer();
    onProgress(buffer.byteLength, headerLength ?? buffer.byteLength);
    return { response: new Response(buffer, response), bytes: buffer.byteLength, totalBytes: headerLength ?? buffer.byteLength };
  }
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      receivedBytes += value.byteLength;
      onProgress(receivedBytes, headerLength);
    }
  }
  const merged = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { response: new Response(merged, response), bytes: receivedBytes, totalBytes: headerLength ?? receivedBytes };
}

function checksumSupported() {
  return typeof crypto !== "undefined" && Boolean(crypto.subtle) && typeof crypto.subtle.digest === "function";
}

async function sha1Hex(bytes: Uint8Array) {
  // `crypto.subtle.digest` needs a real BufferSource, not a view over a
  // possibly shared buffer.
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest("SHA-1", copy.buffer as ArrayBuffer);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function readableError(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Le téléchargement a échoué.";
}

function isAbortError(error: unknown, controller: AbortController) {
  return controller.signal.aborted || (error instanceof Error && error.name === "AbortError");
}

function isQuotaError(error: unknown) {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return error.name === "QuotaExceededError" || error.code === 22;
  }
  return error instanceof Error && error.name === "QuotaExceededError";
}

const MEDIA_MIME_PREFIXES = ["audio/", "video/"] as const;

function mediaMimeMajorType(value: string | null) {
  if (!value) return null;
  const major = value.split(";")[0]?.trim().toLowerCase() ?? "";
  return major.includes("/") ? major : null;
}

/**
 * A download can only be cached when the response is a complete, readable
 * media payload: no opaque CORS responses, no partial content, no HTML error
 * pages masquerading as media.
 */
export function validateDownloadResponse(response: Response, expectedMimeType?: string | null) {
  if (response.type === "opaque" || response.type === "opaqueredirect") {
    return { ok: false as const, message: "La réponse du serveur média est illisible (CORS)." };
  }
  if (response.status === 206) {
    return { ok: false as const, message: "Le serveur a renvoyé un contenu partiel." };
  }
  const actual = mediaMimeMajorType(response.headers?.get("content-type") ?? null);
  if (actual && !MEDIA_MIME_PREFIXES.some((prefix) => actual.startsWith(prefix))) {
    return { ok: false as const, message: "Le fichier reçu n’est pas un média audio ou vidéo." };
  }
  const expected = mediaMimeMajorType(expectedMimeType ?? null);
  if (actual && expected && actual !== expected) {
    return { ok: false as const, message: "Le format reçu ne correspond pas au média attendu." };
  }
  return { ok: true as const, message: null };
}

export interface OfflineStorageOptions {
  env?: OfflineStorageEnv;
  /** Resolved on first use so construction stays safe during SSR renders. */
  envFactory?: () => OfflineStorageEnv;
  onRecords?: (records: DownloadRecord[]) => void;
}

export interface DownloadContext {
  rights?: RightsRecord[];
  variants?: MediaVariant[];
  assets?: MediaAsset[];
  contentIds?: string[];
}

/**
 * Device-local download engine: the registry lives in localStorage while media
 * bytes land in `rihla-offline-media-v1`, the cache the service worker serves.
 */
export class OfflineDownloadStore {
  private readonly envOption?: OfflineStorageEnv;
  private readonly envFactory: () => OfflineStorageEnv;
  private resolvedEnv: OfflineStorageEnv | null = null;
  private readonly onRecords?: (records: DownloadRecord[]) => void;
  private records: DownloadRecord[] = [];
  /**
   * In-flight attempts keyed by record id. The token identifies one specific
   * attempt, so a late async settlement can never overwrite a newer retry.
   */
  private attempts = new Map<string, { controller: AbortController; token: object }>();
  private listeners = new Set<(records: DownloadRecord[]) => void>();
  private loaded = false;
  private lastPersistError: string | null = null;

  constructor(options: OfflineStorageOptions = {}) {
    this.envOption = options.env;
    this.envFactory = options.envFactory ?? browserEnv;
    this.onRecords = options.onRecords;
  }

  /**
   * Environment handles are resolved lazily: touching `window.localStorage` or
   * `caches` while rendering would break SSR and hydration.
   */
  private get env(): OfflineStorageEnv {
    if (!this.resolvedEnv) this.resolvedEnv = this.envOption ?? this.envFactory();
    return this.resolvedEnv;
  }

  get isSupported() {
    if (this.resolvedEnv) return Boolean(this.resolvedEnv.caches && this.resolvedEnv.storage);
    return Boolean(this.envOption?.caches && this.envOption?.storage);
  }

  subscribe(listener: (records: DownloadRecord[]) => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  snapshot() {
    return this.records;
  }

  activeIds() {
    return [...this.attempts.keys()];
  }

  /** Loads the registry, recovering interrupted sessions as ERROR. */
  load(): DownloadRecord[] {
    const stored = this.env.storage?.getItem(DOWNLOAD_REGISTRY_KEY) ?? null;
    const parsed = parseRegistry(stored);
    const recovered = recoverInterruptedDownloads(parsed, this.attempts.keys());
    this.records = recovered;
    this.loaded = true;
    if (recovered.some((record, index) => record.status !== parsed[index]?.status)) this.persist();
    this.emit();
    return this.records;
  }

  private ensureLoaded() {
    if (!this.loaded) this.load();
  }

  private persist() {
    try {
      const storage = this.env.storage;
      if (!storage) return false;
      storage.setItem(DOWNLOAD_REGISTRY_KEY, JSON.stringify({ version: 1, records: this.records }));
      this.lastPersistError = null;
      return true;
    } catch (error) {
      // Quota or private-mode failures keep the in-memory registry usable, but
      // callers must know the record may not survive a reload.
      this.lastPersistError = isQuotaError(error)
        ? "Espace de stockage insuffisant pour enregistrer les téléchargements."
        : readableError(error);
      return false;
    }
  }

  /** Message of the last failed registry write, if any. */
  get persistError() {
    return this.lastPersistError;
  }

  private emit() {
    for (const listener of this.listeners) listener(this.records);
    this.onRecords?.(this.records);
  }

  private commit(records: DownloadRecord[]) {
    this.records = records;
    this.persist();
    this.emit();
  }

  private patch(id: string, patch: Partial<DownloadRecord>) {
    this.records = this.records.map((record) =>
      record.id === id ? { ...record, ...patch, updatedAt: Date.now() } : record,
    );
    this.persist();
    this.emit();
  }

  private upsert(record: DownloadRecord) {
    const exists = this.records.some((entry) => entry.id === record.id);
    this.records = exists ? this.records.map((entry) => (entry.id === record.id ? record : entry)) : [...this.records, record];
    this.persist();
    this.emit();
  }

  private async openCache(): Promise<OfflineCacheLike | null> {
    if (!this.env.caches) return null;
    try {
      return await this.env.caches.open(CACHE_NAME);
    } catch {
      return null;
    }
  }

  async cachedUrls(): Promise<string[]> {
    const cache = await this.openCache();
    if (!cache) return [];
    try {
      return (await cache.keys()).map(cacheUrl);
    } catch {
      return [];
    }
  }

  storageEstimate(): Promise<StorageEstimate> {
    return estimateFromEnv(this.env);
  }

  /**
   * Explicit, rights-checked download with stream progress and abort support.
   * Blocked attempts return a typed reason instead of throwing.
   */
  async download(request: DownloadRequest): Promise<DownloadAttemptResult> {
    this.ensureLoaded();
    const { asset, content } = request;
    const rights = request.rights ?? [];
    const variants = request.variants ?? [];

    const decision = canPersistOfflineDownload(asset, rights);
    if (!decision.allowed) {
      return { ok: false, record: null, reason: decision.reason ?? "UNKNOWN", message: decision.message ?? undefined };
    }

    const target = resolveDownloadTarget(asset, variants, request.quality);
    // The resolved variant URL is gated too: a quality option must not smuggle
    // in a blocked or invalid source.
    const targetUrlReason = offlineUrlDecision(target.url);
    if (targetUrlReason) {
      return {
        ok: false,
        record: null,
        reason: targetUrlReason,
        message: targetUrlReason === "URL_INVALID"
          ? "La qualité sélectionnée ne dispose pas d’une URL valide."
          : "Les ressources Coran ne peuvent pas être conservées hors connexion.",
      };
    }
    const id = downloadRecordId(content.id, asset.id, target.quality);
    const existing = this.records.find((record) => record.id === id);
    if (this.attempts.has(id)) {
      return { ok: false, record: existing ?? null, reason: "UNKNOWN", message: "Téléchargement déjà en cours." };
    }
    if (existing && existing.status === "AVAILABLE" && existing.url === target.url) {
      const verified = await this.verifyCachedRecord(existing);
      if (verified.ok) return { ok: true, record: existing, reason: "ALREADY_DOWNLOADED" };
      this.patch(id, { status: verified.status, error: verified.message });
    }
    if (!this.isSupported) {
      return {
        ok: false,
        record: existing ?? null,
        reason: "STORAGE_UNAVAILABLE",
        message: "Le stockage hors connexion n’est pas disponible sur cet appareil.",
      };
    }
    if (!this.env.fetch) {
      return { ok: false, record: existing ?? null, reason: "NETWORK_ERROR", message: "Le réseau n’est pas disponible." };
    }
    const quota = await this.preflightQuota(target.sizeBytes ?? null);
    if (quota) return { ok: false, record: existing ?? null, reason: "QUOTA_EXCEEDED", message: quota };

    const now = Date.now();
    const record: DownloadRecord = {
      id,
      contentId: content.id,
      mediaAssetId: asset.id,
      variantId: target.variantId,
      title: content.title,
      url: target.url,
      quality: target.quality,
      checksum: target.checksum ?? null,
      rightsRecordId: asset.rightsRecordId,
      status: "DOWNLOADING",
      receivedBytes: 0,
      totalBytes: target.sizeBytes ?? null,
      sizeBytes: null,
      timestamp: existing?.timestamp ?? now,
      updatedAt: now,
      error: null,
    };
    this.upsert(record);

    const controller = new AbortController();
    const token = {};
    this.attempts.set(id, { controller, token });
    const isCurrent = () => this.attempts.get(id)?.token === token;
    let lastEmit = 0;
    try {
      const response = await this.env.fetch(target.url, { signal: controller.signal, mode: "cors" });
      if (!isCurrent()) return this.abandonedResult(id);
      if (!response.ok) throw new Error("Le média n’a pas pu être téléchargé.");
      const validation = validateDownloadResponse(response, target.mimeType ?? asset.mimeType ?? null);
      if (!validation.ok) {
        this.attempts.delete(id);
        this.patch(id, { status: "ERROR", error: validation.message, receivedBytes: 0, sizeBytes: null });
        return { ok: false, record: this.records.find((entry) => entry.id === id) ?? null, reason: "NETWORK_ERROR", message: validation.message };
      }
      const buffered = await bufferResponseWithProgress(response, (receivedBytes, totalBytes) => {
        if (!isCurrent()) return;
        const tick = Date.now();
        const complete = totalBytes !== null && receivedBytes >= totalBytes;
        if (!complete && tick - lastEmit < 120) return;
        lastEmit = tick;
        this.patch(id, { receivedBytes, totalBytes: totalBytes ?? record.totalBytes });
      });
      // A cancel or remove while the body was streaming must win over the
      // buffered payload, before anything is written to Cache Storage.
      if (!isCurrent()) return this.abandonedResult(id);
      if (target.checksum && checksumSupported()) {
        const digest = await sha1Hex(new Uint8Array(await buffered.response.clone().arrayBuffer()));
        if (!isCurrent()) return this.abandonedResult(id);
        if (digest.toLowerCase() !== target.checksum.toLowerCase()) {
          this.attempts.delete(id);
          this.patch(id, { status: "ERROR", error: "Le fichier téléchargé est corrompu.", receivedBytes: 0, sizeBytes: null });
          return {
            ok: false,
            record: this.records.find((entry) => entry.id === id) ?? null,
            reason: "CHECKSUM_MISMATCH",
            message: "Le fichier téléchargé est corrompu.",
          };
        }
      }
      const cache = await this.openCache();
      if (!cache) throw new Error("Le stockage hors connexion n’est pas disponible sur cet appareil.");
      if (!isCurrent()) return this.abandonedResult(id);
      await cache.put(target.url, buffered.response);
      // An abort that landed during `cache.put` still counts as cancelled.
      if (!isCurrent()) {
        await this.deleteCachedUrl(target.url);
        return this.abandonedResult(id);
      }
      this.attempts.delete(id);
      const available: DownloadRecord = {
        ...record,
        status: "AVAILABLE",
        receivedBytes: buffered.bytes,
        totalBytes: buffered.totalBytes,
        sizeBytes: buffered.bytes,
        updatedAt: Date.now(),
        error: null,
      };
      this.upsert(available);
      if (this.lastPersistError) {
        return { ok: true, record: available, reason: "UNKNOWN", message: this.lastPersistError };
      }
      return { ok: true, record: available };
    } catch (error) {
      if (!isCurrent()) return this.abandonedResult(id);
      this.attempts.delete(id);
      const aborted = isAbortError(error, controller);
      if (isQuotaError(error)) {
        this.patch(id, { status: "ERROR", error: "Espace de stockage insuffisant.", receivedBytes: 0, sizeBytes: null });
        return {
          ok: false,
          record: this.records.find((entry) => entry.id === id) ?? null,
          reason: "QUOTA_EXCEEDED",
          message: "Espace de stockage insuffisant pour ce téléchargement.",
        };
      }
      const failed: DownloadRecord = {
        ...record,
        status: aborted ? "CANCELLED" : "ERROR",
        error: aborted ? "Téléchargement annulé." : readableError(error),
        receivedBytes: 0,
        sizeBytes: null,
        updatedAt: Date.now(),
      };
      this.upsert(failed);
      return { ok: false, record: failed, reason: aborted ? "UNKNOWN" : "NETWORK_ERROR", message: failed.error ?? undefined };
    }
  }

  /** Result for an attempt whose cancel/remove already settled the record. */
  private abandonedResult(id: string): DownloadAttemptResult {
    return { ok: false, record: this.records.find((entry) => entry.id === id) ?? null, reason: "UNKNOWN", message: "Téléchargement annulé." };
  }

  private async deleteCachedUrl(url: string) {
    const cache = await this.openCache();
    if (!cache) return;
    try {
      await cache.delete(url);
    } catch {
      // Best effort.
    }
  }

  /**
   * An AVAILABLE record is only trustworthy when the bytes are still in the
   * cache and the checksum still matches; otherwise the file must be fetched
   * again instead of being reported as offline-ready.
   */
  private async verifyCachedRecord(record: DownloadRecord): Promise<{ ok: boolean; status: DownloadRecord["status"]; message: string | null }> {
    const cache = await this.openCache();
    if (!cache) return { ok: false, status: "ERROR", message: "Le stockage hors connexion n’est pas disponible sur cet appareil." };
    let cached: Response | undefined;
    try {
      cached = await cache.match(record.url);
    } catch {
      return { ok: false, status: "ERROR", message: "Le cache local est illisible." };
    }
    if (!cached) return { ok: false, status: "MISSING", message: "Fichier local introuvable." };
    if (record.checksum && checksumSupported()) {
      try {
        const digest = await sha1Hex(new Uint8Array(await cached.clone().arrayBuffer()));
        if (digest.toLowerCase() !== record.checksum.toLowerCase()) {
          await this.deleteCachedUrl(record.url);
          return { ok: false, status: "STALE", message: "Le fichier local ne correspond plus à la version attendue." };
        }
      } catch {
        return { ok: false, status: "MISSING", message: "Le fichier local est illisible." };
      }
    }
    return { ok: true, status: "AVAILABLE", message: null };
  }

  /** Refuses a download that provably cannot fit in the remaining quota. */
  private async preflightQuota(sizeBytes: number | null) {
    if (!sizeBytes || sizeBytes <= 0) return null;
    const estimate = await this.storageEstimate();
    if (estimate.available === null) return null;
    if (sizeBytes > estimate.available) return "Espace de stockage insuffisant pour ce téléchargement.";
    return null;
  }

  async cancel(id: string): Promise<DownloadRecord | null> {
    this.ensureLoaded();
    const attempt = this.attempts.get(id);
    if (attempt) {
      // Drop the token first: the in-flight attempt is no longer authoritative.
      this.attempts.delete(id);
      attempt.controller.abort();
    }
    const record = this.records.find((entry) => entry.id === id) ?? null;
    if (!record) return null;
    if (record.status === "DOWNLOADING") {
      this.patch(id, { status: "CANCELLED", error: "Téléchargement annulé.", receivedBytes: 0, sizeBytes: null });
    }
    return this.records.find((entry) => entry.id === id) ?? null;
  }

  async remove(id: string): Promise<boolean> {
    this.ensureLoaded();
    const record = this.records.find((entry) => entry.id === id);
    if (!record) return false;
    await this.cancel(id);
    await this.deleteCachedUrl(record.url);
    this.commit(this.records.filter((entry) => entry.id !== id));
    return true;
  }

  async retry(id: string, context: DownloadContext & { content?: { id: string; title: string }; asset?: MediaAsset } = {}): Promise<DownloadAttemptResult> {
    this.ensureLoaded();
    const record = this.records.find((entry) => entry.id === id);
    if (!record) return { ok: false, record: null, reason: "UNKNOWN", message: "Téléchargement introuvable." };
    const asset = context.asset ?? (context.assets ?? []).find((entry) => entry.id === record.mediaAssetId);
    if (!asset) {
      return { ok: false, record, reason: "UNKNOWN", message: "Média introuvable pour relancer le téléchargement." };
    }
    return this.download({
      content: context.content ?? { id: record.contentId, title: record.title },
      asset,
      quality: record.quality,
      rights: context.rights ?? [],
      variants: context.variants ?? [],
    });
  }

  /**
   * Aligns the registry with Cache Storage and the current catalog, and clears
   * cache entries left behind by aborted, revoked or removed downloads.
   */
  async reconcile(context: DownloadContext = {}): Promise<DownloadReconcileReport> {
    this.ensureLoaded();
    const cachedUrls = await this.cachedUrls();
    const report = reconcileDownloads(this.records, { cachedUrls, ...context });
    const cache = await this.openCache();
    if (cache) {
      for (const url of [...report.purgedUrls, ...report.removedOrphans]) {
        try {
          await cache.delete(url);
        } catch {
          // Keep reconciling the remaining entries.
        }
      }
    }
    this.commit(report.records);
    return report;
  }
}

export function createOfflineDownloadStore(options: OfflineStorageOptions = {}) {
  return new OfflineDownloadStore(options);
}

/** Cache-first read used by offline playback paths. */
export async function matchDownloadedMedia(url: string, env: OfflineStorageEnv = browserEnv()) {
  if (!env.caches) return undefined;
  try {
    const cache = await env.caches.open(CACHE_NAME);
    return await cache.match(url);
  } catch {
    return undefined;
  }
}

export async function isMediaDownloaded(url: string, env: OfflineStorageEnv = browserEnv()) {
  return Boolean(await matchDownloadedMedia(url, env));
}

export async function removeDownloadedMedia(url: string, env: OfflineStorageEnv = browserEnv()) {
  if (!env.caches) return false;
  try {
    const cache = await env.caches.open(CACHE_NAME);
    return await cache.delete(url);
  } catch {
    return false;
  }
}
