import type { MediaAsset } from "@/lib/domain";

const CACHE_NAME = "rihla-offline-media-v1";

export async function downloadMediaAsset(asset: MediaAsset) {
  if (typeof window === "undefined" || !("caches" in window)) throw new Error("Le stockage hors connexion n’est pas disponible sur cet appareil.");
  const response = await fetch(asset.url, { mode: "cors" });
  if (!response.ok) throw new Error("Le média n’a pas pu être téléchargé.");
  const cache = await caches.open(CACHE_NAME);
  await cache.put(asset.url, response.clone());
  return { sizeBytes: Number(response.headers.get("content-length") ?? 0) || undefined };
}

export async function isMediaDownloaded(url: string) {
  if (typeof window === "undefined" || !("caches" in window)) return false;
  return Boolean(await (await caches.open(CACHE_NAME)).match(url));
}

export async function removeDownloadedMedia(url: string) {
  if (typeof window === "undefined" || !("caches" in window)) return false;
  return (await caches.open(CACHE_NAME)).delete(url);
}
