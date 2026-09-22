import type { MediaAsset, MediaVariant, RightsRecord } from "./domain";

/** Cache Storage bucket shared with the app service worker. */
export const OFFLINE_MEDIA_CACHE = "rihla-offline-media-v1";

/**
 * Local-only registry. Downloads belong to the device, so this key stays
 * outside the cloud-synced library payload on purpose.
 */
export const DOWNLOAD_REGISTRY_KEY = "rihla.downloads.v1";

export const DOWNLOAD_QUALITIES = ["DATA_SAVER", "STANDARD", "HIGH"] as const;
export type DownloadQuality = (typeof DOWNLOAD_QUALITIES)[number];

export type DownloadQualityInput = DownloadQuality | "data-saver" | "standard" | "high";

export const DOWNLOAD_STATUSES = [
  "DOWNLOADING",
  "AVAILABLE",
  "ERROR",
  "CANCELLED",
  "STALE",
  "MISSING",
] as const;
export type DownloadStatus = (typeof DOWNLOAD_STATUSES)[number];

export type DownloadBlockReason =
  | "RIGHTS_MISSING"
  | "RIGHTS_FORBIDDEN"
  | "RIGHTS_REVOKED"
  | "QURAN_FOUNDATION_BLOCKED"
  | "URL_INVALID"
  | "WIFI_CONSENT_REQUIRED"
  | "WIFI_ONLY"
  | "OFFLINE"
  | "QUOTA_EXCEEDED"
  | "ALREADY_DOWNLOADED"
  | "STORAGE_UNAVAILABLE"
  | "CHECKSUM_MISMATCH"
  | "NETWORK_ERROR"
  | "UNKNOWN";

/** Why a cached file had to be dropped during reconciliation. */
export type DownloadPurgeReason =
  | "RIGHTS_REVOKED"
  | "RIGHTS_FORBIDDEN"
  | "RIGHTS_MISSING"
  | "ASSET_REMOVED"
  | "CONTENT_REMOVED"
  | "CACHE_ORPHAN";

export interface DownloadRecord {
  /** Deterministic: `${contentId}:${mediaAssetId}:${quality}`. */
  id: string;
  contentId: string;
  mediaAssetId: string;
  variantId?: string;
  title: string;
  /** Exact URL written into Cache Storage. */
  url: string;
  quality: DownloadQuality;
  checksum?: string | null;
  rightsRecordId: string;
  status: DownloadStatus;
  receivedBytes: number;
  totalBytes: number | null;
  sizeBytes: number | null;
  timestamp: number;
  updatedAt: number;
  error?: string | null;
}

export interface DownloadContentRef {
  id: string;
  title: string;
}

export interface DownloadRequest {
  content: DownloadContentRef;
  asset: MediaAsset;
  quality?: DownloadQualityInput;
  variants?: MediaVariant[];
  rights?: RightsRecord[];
  /** Explicit user confirmation, used when the connection type is unknown. */
  consent?: boolean;
}

export interface DownloadAttemptResult {
  ok: boolean;
  record: DownloadRecord | null;
  reason?: DownloadBlockReason;
  needsConsent?: boolean;
  message?: string;
}

export interface StorageEstimate {
  usage: number;
  quota: number | null;
  available: number | null;
}

export interface DownloadReconcileReport {
  records: DownloadRecord[];
  /** Cache entries removed because rights were revoked. */
  purgedUrls: string[];
  /** Cache entries removed because no record referenced them. */
  removedOrphans: string[];
  /** Detailed reason per purged entry, for user-facing messaging. */
  purged: Array<{ url: string; recordId: string; reason: DownloadPurgeReason; cachePurged: boolean }>;
}

/** Minimal Cache Storage surface used by the download pipeline. */
export interface OfflineCacheLike {
  put(request: string, response: Response): Promise<void>;
  match(request: string): Promise<Response | undefined> | Response | undefined;
  delete(request: string): Promise<boolean> | boolean;
  keys(): Promise<ReadonlyArray<Request | string>>;
}

export interface OfflineCacheStorageLike {
  open(name: string): Promise<OfflineCacheLike>;
  keys?(): Promise<ReadonlyArray<string>>;
}

export interface OfflineRegistryStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface OfflineStorageEnv {
  caches?: OfflineCacheStorageLike;
  storage?: OfflineRegistryStorageLike;
  fetch?: typeof fetch;
  estimate?: () => Promise<StorageEstimate>;
}
