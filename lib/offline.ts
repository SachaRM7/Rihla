import type { MediaAsset, MediaVariant, RightsRecord } from "./domain";
import {
  DOWNLOAD_QUALITIES,
  type DownloadBlockReason,
  type DownloadRecord,
  type DownloadPurgeReason,
  type DownloadQuality,
  type DownloadQualityInput,
  type DownloadReconcileReport,
} from "./download-types";

/**
 * Quran Foundation media is streamed through its own API and must never be
 * mirrored into a permanent local cache.
 */
export const QURAN_FOUNDATION_HOSTS = [
  "quran.foundation",
  "verses.quran.foundation",
  "api.quran.com",
  "quran.com",
  "api.alquran.cloud",
] as const;

export function formatDownloadSize(bytes?: number) {
  if (!bytes || bytes <= 0) return "Taille inconnue";
  const mb = bytes / 1024 / 1024;
  return mb < 1024 ? mb.toFixed(mb < 10 ? 1 : 0) + " Mo" : (mb / 1024).toFixed(1) + " Go";
}

export function availableOffline(records: DownloadRecord[], contentId: string) {
  return records.some((item) => item.contentId === contentId && item.status === "AVAILABLE");
}

export function normalizeDownloadQuality(quality?: DownloadQualityInput): DownloadQuality {
  if (!quality) return "STANDARD";
  if (quality === "data-saver") return "DATA_SAVER";
  if (quality === "high") return "HIGH";
  if (quality === "standard") return "STANDARD";
  return DOWNLOAD_QUALITIES.includes(quality) ? quality : "STANDARD";
}

export function downloadRecordId(contentId: string, mediaAssetId: string, quality: DownloadQualityInput = "STANDARD") {
  return `${contentId}:${mediaAssetId}:${normalizeDownloadQuality(quality)}`;
}

export function isQuranFoundationUrl(url: string) {
  let host: string;
  try {
    host = new URL(url).host.toLowerCase();
  } catch {
    return false;
  }
  return QURAN_FOUNDATION_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * URL-level offline gate. Applied to the resolved variant URL as well as the
 * asset URL, so a quality variant cannot smuggle a blocked source in.
 */
export function offlineUrlDecision(url: string): DownloadBlockReason | null {
  if (!isHttpUrl(url)) return "URL_INVALID";
  if (isQuranFoundationUrl(url)) return "QURAN_FOUNDATION_BLOCKED";
  return null;
}

function isVerifiedRights(record: RightsRecord | undefined) {
  return record?.verification === "HUMAN_VERIFIED" || record?.verification === "PARTNER_VERIFIED";
}

export interface OfflineDownloadDecision {
  allowed: boolean;
  reason: DownloadBlockReason | null;
  message: string | null;
  rights?: RightsRecord;
}

/**
 * Offline retention is stricter than streaming: verified human or partner
 * rights, no revocation, and explicit host-copy plus offline permissions.
 */
export function canPersistOfflineDownload(asset: MediaAsset, rights: RightsRecord[]): OfflineDownloadDecision {
  const urlReason = offlineUrlDecision(asset.url);
  if (urlReason === "URL_INVALID") {
    return { allowed: false, reason: "URL_INVALID", message: "Le média ne dispose pas d’une URL valide." };
  }
  if (urlReason === "QURAN_FOUNDATION_BLOCKED") {
    return {
      allowed: false,
      reason: "QURAN_FOUNDATION_BLOCKED",
      message: "Les ressources Coran ne peuvent pas être conservées hors connexion.",
    };
  }
  const record = rights.find((item) => item.id === asset.rightsRecordId);
  if (!record) {
    return { allowed: false, reason: "RIGHTS_MISSING", message: "Droits manquants pour ce média." };
  }
  if (record.revokedAt) {
    return { allowed: false, reason: "RIGHTS_REVOKED", message: "Les droits de ce média ont été révoqués.", rights: record };
  }
  if (!isVerifiedRights(record)) {
    return {
      allowed: false,
      reason: "RIGHTS_FORBIDDEN",
      message: "Les droits de ce média ne sont pas vérifiés pour un usage hors connexion.",
      rights: record,
    };
  }
  if (record.capabilities.hostCopy !== "YES" || record.capabilities.downloadOffline !== "YES") {
    return {
      allowed: false,
      reason: "RIGHTS_FORBIDDEN",
      message: "Ce média n’est pas autorisé au téléchargement hors connexion.",
      rights: record,
    };
  }
  return { allowed: true, reason: null, message: null, rights: record };
}

/** Single entry point for UI gates: delegates to the strict offline decision. */
export function canDownloadOffline(asset: MediaAsset, rights: RightsRecord[]) {
  return canPersistOfflineDownload(asset, rights).allowed;
}

export interface DownloadTarget {
  url: string;
  quality: DownloadQuality;
  variantId?: string;
  checksum?: string | null;
  sizeBytes?: number | null;
  mimeType?: string;
}

/**
 * Quality selection uses catalog variants whose `mediaAssetId` matches the
 * asset exactly, then falls back the way the player does. Integrity metadata
 * always belongs to the selected URL: an asset-level checksum is only reused
 * when the variant points at the very same URL.
 */
export function resolveDownloadTarget(
  asset: MediaAsset,
  variants: MediaVariant[] = [],
  quality?: DownloadQualityInput,
): DownloadTarget {
  const wanted = normalizeDownloadQuality(quality);
  const siblings = variants.filter((variant) => variant.mediaAssetId === asset.id && variant.kind === asset.kind);
  const variant =
    siblings.find((entry) => entry.quality === wanted)
    ?? (wanted !== "STANDARD" ? siblings.find((entry) => entry.quality === "STANDARD") : undefined)
    ?? siblings[0];
  if (!variant) {
    return {
      url: asset.url,
      quality: wanted,
      checksum: asset.checksumSha1 ?? null,
      sizeBytes: asset.sizeBytes ?? null,
      mimeType: asset.mimeType,
    };
  }
  const sameUrl = variant.url === asset.url;
  return {
    url: variant.url,
    quality: variant.quality ?? wanted,
    variantId: variant.id,
    checksum: variant.checksumSha1 ?? (sameUrl ? asset.checksumSha1 ?? null : null),
    sizeBytes: variant.sizeBytes ?? (sameUrl ? asset.sizeBytes ?? null : null),
    mimeType: variant.mimeType ?? asset.mimeType,
  };
}

export interface DownloadReconcileContext {
  /** URLs currently present in the `rihla-offline-media-v1` cache. */
  cachedUrls: string[];
  assets?: MediaAsset[];
  rights?: RightsRecord[];
  variants?: MediaVariant[];
  /** When provided, records whose content left the catalog are purged. */
  contentIds?: string[];
}

function isLiveRecord(record: DownloadRecord) {
  return record.status === "AVAILABLE"
    || record.status === "DOWNLOADING"
    || record.status === "STALE"
    || record.status === "ERROR";
}

function purgeReason(record: DownloadRecord, context: {
  asset: MediaAsset | undefined;
  rights: RightsRecord | undefined;
  contentIds: Set<string> | null;
}): DownloadPurgeReason | null {
  const { asset, rights, contentIds } = context;
  if (contentIds && !contentIds.has(record.contentId)) return "CONTENT_REMOVED";
  if (!asset) return "ASSET_REMOVED";
  if (!rights) return "RIGHTS_MISSING";
  if (rights.revokedAt) return "RIGHTS_REVOKED";
  if (!isVerifiedRights(rights) || rights.capabilities.hostCopy !== "YES" || rights.capabilities.downloadOffline !== "YES") {
    return "RIGHTS_FORBIDDEN";
  }
  return null;
}

/**
 * Reconciles the local registry with Cache Storage and the current catalog.
 * Cache purged by the browser becomes MISSING, lost rights or removed catalog
 * entries drop the cache file, and a changed source or checksum marks the
 * record STALE.
 */
export function reconcileDownloads(records: DownloadRecord[], context: DownloadReconcileContext): DownloadReconcileReport {
  const cached = new Set(context.cachedUrls);
  const assets = new Map((context.assets ?? []).map((asset) => [asset.id, asset]));
  const rights = new Map((context.rights ?? []).map((entry) => [entry.id, entry]));
  const contentIds = context.contentIds ? new Set(context.contentIds) : null;
  const purged: Array<{ url: string; recordId: string; reason: DownloadPurgeReason; cachePurged: boolean }> = [];
  const purgedUrls = new Set<string>();

  const next = records.map((record) => {
    const asset = assets.get(record.mediaAssetId);
    const rightsRecord = rights.get(asset?.rightsRecordId ?? record.rightsRecordId);
    const reason = purgeReason(record, { asset, rights: rightsRecord, contentIds });
    if (reason) {
      purged.push({ url: record.url, recordId: record.id, reason, cachePurged: false });
      purgedUrls.add(record.url);
      return {
        ...record,
        status: "CANCELLED" as const,
        error: purgeMessage(reason),
        receivedBytes: 0,
        sizeBytes: null,
        updatedAt: Date.now(),
      };
    }
    if (asset) {
      const target = resolveDownloadTarget(asset, context.variants ?? [], record.quality);
      const checksumChanged = Boolean(record.checksum) && Boolean(target.checksum) && target.checksum !== record.checksum;
      if (target.url !== record.url || checksumChanged) {
        return { ...record, status: "STALE" as const, error: "Une nouvelle version est disponible.", updatedAt: Date.now() };
      }
    }
    if (record.status === "AVAILABLE" && !cached.has(record.url)) {
      return { ...record, status: "MISSING" as const, error: "Fichier local introuvable.", sizeBytes: null, updatedAt: Date.now() };
    }
    return record;
  });

  // A URL still needed by a live record must survive in Cache Storage, but the
  // purged record itself stays CANCELLED: rights are per record, never revived
  // by a healthy sibling.
  const liveUrls = new Set(next.filter(isLiveRecord).map((record) => record.url));
  for (const url of [...purgedUrls]) {
    if (liveUrls.has(url)) purgedUrls.delete(url);
  }

  const removedOrphans = context.cachedUrls.filter((url) => !liveUrls.has(url) && !purgedUrls.has(url));
  return {
    records: next,
    purgedUrls: [...purgedUrls],
    removedOrphans,
    purged: purged.map((entry) => ({ ...entry, cachePurged: purgedUrls.has(entry.url) })),
  };
}

function purgeMessage(reason: DownloadPurgeReason) {
  if (reason === "RIGHTS_REVOKED") return "Droits révoqués : le fichier local a été supprimé.";
  if (reason === "RIGHTS_FORBIDDEN") return "Droits hors connexion retirés : le fichier local a été supprimé.";
  if (reason === "RIGHTS_MISSING") return "Droits introuvables : le fichier local a été supprimé.";
  if (reason === "ASSET_REMOVED") return "Média retiré du catalogue : le fichier local a été supprimé.";
  if (reason === "CONTENT_REMOVED") return "Contenu retiré du catalogue : le fichier local a été supprimé.";
  return "Fichier local supprimé.";
}

/**
 * A record persisted as DOWNLOADING without a live in-flight request can only
 * be the leftover of an interrupted session (reload, crash, tab close).
 */
export function recoverInterruptedDownloads(records: DownloadRecord[], activeIds: Iterable<string>) {
  const active = new Set(activeIds);
  return records.map((record) =>
    record.status === "DOWNLOADING" && !active.has(record.id)
      ? { ...record, status: "ERROR" as const, error: "Téléchargement interrompu.", updatedAt: Date.now() }
      : record,
  );
}

export function downloadProgressRatio(record: DownloadRecord) {
  const total = record.totalBytes ?? record.sizeBytes ?? 0;
  if (!total || total <= 0) return null;
  return Math.min(1, Math.max(0, record.receivedBytes / total));
}

export const downloadStatusLabels: Record<DownloadRecord["status"], string> = {
  DOWNLOADING: "Téléchargement en cours",
  AVAILABLE: "Disponible hors connexion",
  ERROR: "Téléchargement échoué",
  CANCELLED: "Téléchargement annulé",
  STALE: "Mise à jour disponible",
  MISSING: "Fichier manquant",
};
