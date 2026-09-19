import type { DownloadRecord, MediaAsset, RightsRecord } from "./domain";

export function canDownloadOffline(asset: MediaAsset, rights: RightsRecord[]) {
  const record = rights.find((item) => item.id === asset.rightsRecordId);
  return record?.capabilities.downloadOffline === "YES" && record.capabilities.hostCopy === "YES";
}

export function formatDownloadSize(bytes?: number) {
  if (!bytes || bytes <= 0) return "Taille inconnue";
  const mb = bytes / 1024 / 1024;
  return mb < 1024 ? mb.toFixed(mb < 10 ? 1 : 0) + " Mo" : (mb / 1024).toFixed(1) + " Go";
}

export function availableOffline(records: DownloadRecord[], contentId: string) {
  return records.some((item) => item.contentId === contentId && item.status === "AVAILABLE");
}
