"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MediaAsset, MediaVariant, RightsRecord } from "@/lib/domain";
import {
  type DownloadAttemptResult,
  type DownloadQualityInput,
  type DownloadRecord,
  type OfflineStorageEnv,
  type StorageEstimate,
} from "@/lib/download-types";
import { downloadProgressRatio } from "@/lib/offline";
import { createOfflineDownloadStore, OfflineDownloadStore } from "@/lib/offline-storage";

export type DownloadConnectionType = "wifi" | "cellular" | "ethernet" | "other" | null;

export interface UseDownloadsCatalog {
  media?: MediaAsset[];
  rights?: RightsRecord[];
  variants?: MediaVariant[];
  contentIds?: string[];
}

export interface UseDownloadsOptions {
  rights?: RightsRecord[];
  variants?: MediaVariant[];
  catalog?: UseDownloadsCatalog;
  /** From preferences.audioQuality; `data-saver` style values are accepted. */
  quality?: DownloadQualityInput;
  /** From preferences.wifiOnlyDownloads. */
  wifiOnly?: boolean;
  connectionType?: DownloadConnectionType;
  online?: boolean;
  env?: OfflineStorageEnv;
  store?: OfflineDownloadStore;
  autoReconcile?: boolean;
}

export interface UseDownloadsResult {
  records: DownloadRecord[];
  loading: boolean;
  ready: boolean;
  supported: boolean;
  error: string | null;
  download: (
    content: { id: string; title: string },
    asset: MediaAsset,
    quality?: DownloadQualityInput,
    overrides?: { consent?: boolean; rights?: RightsRecord[]; variants?: MediaVariant[] },
  ) => Promise<DownloadAttemptResult>;
  cancel: (id: string) => Promise<DownloadRecord | null>;
  remove: (id: string) => Promise<boolean>;
  retry: (
    id: string,
    overrides?: {
      consent?: boolean;
      rights?: RightsRecord[];
      variants?: MediaVariant[];
      asset?: MediaAsset;
      content?: { id: string; title: string };
    },
  ) => Promise<DownloadAttemptResult>;
  refresh: () => Promise<void>;
  storageEstimate: () => Promise<StorageEstimate>;
  clearError: () => void;
  recordFor: (contentId: string, mediaAssetId: string, quality?: DownloadQualityInput) => DownloadRecord | null;
  progressOf: (record: DownloadRecord) => number | null;
}

function readConnectionType(): DownloadConnectionType {
  if (typeof navigator === "undefined") return null;
  const connection = (navigator as Navigator & { connection?: { type?: string } }).connection;
  const type = connection?.type;
  if (!type) return null;
  if (type === "wifi" || type === "cellular" || type === "ethernet") return type;
  // `unknown`, `other`, `bluetooth`... stay unknown so the UI can ask for
  // explicit consent instead of silently announcing Wi-Fi.
  return null;
}

function isOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/**
 * Device-local downloads: registry, cache, progress, abort, retry and
 * reconciliation. Nothing here is cloud-synced.
 */
export function useDownloads(options: UseDownloadsOptions = {}): UseDownloadsResult {
  // Lazy state keeps the store stable across renders without touching refs
  // during render, and defers environment resolution to the first commit.
  const [store] = useState<OfflineDownloadStore>(() => options.store ?? createOfflineDownloadStore({ env: options.env }));

  const [records, setRecords] = useState<DownloadRecord[]>(() => store.snapshot());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Detected values only; explicit props always win over detection. */
  const [detectedConnection, setDetectedConnection] = useState<DownloadConnectionType>(null);
  const [detectedOnline, setDetectedOnline] = useState(true);
  const [ready, setReady] = useState(false);

  const rights = useMemo(() => options.rights ?? options.catalog?.rights ?? [], [options.catalog?.rights, options.rights]);
  const variants = useMemo(() => options.variants ?? options.catalog?.variants ?? [], [options.catalog?.variants, options.variants]);
  const catalog = useMemo(
    () => ({
      assets: options.catalog?.media,
      rights: options.catalog?.rights,
      variants: options.catalog?.variants,
      contentIds: options.catalog?.contentIds,
    }),
    [options.catalog],
  );

  useEffect(() => store.subscribe(setRecords), [store]);

  useEffect(() => {
    // Hydration runs after mount so SSR never touches localStorage or caches.
    queueMicrotask(() => {
      try {
        setRecords(store.load());
      } catch {
        setError("Les téléchargements locaux n’ont pas pu être lus.");
      }
      setReady(true);
    });
  }, [store]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await store.reconcile(catalog);
      setRecords(store.snapshot());
      setError(null);
    } catch (reconcileError) {
      setError(reconcileError instanceof Error ? reconcileError.message : "La vérification des téléchargements a échoué.");
    } finally {
      setLoading(false);
    }
  }, [catalog, store]);

  useEffect(() => {
    if (options.autoReconcile === false) return;
    const frame = window.requestAnimationFrame(() => { void refresh(); });
    return () => window.cancelAnimationFrame(frame);
  }, [options.autoReconcile, refresh]);

  useEffect(() => {
    if (options.connectionType !== undefined) return;
    const connection = typeof navigator === "undefined" ? undefined : (navigator as Navigator & { connection?: { addEventListener?: (type: string, listener: () => void) => void; removeEventListener?: (type: string, listener: () => void) => void } }).connection;
    if (!connection?.addEventListener) return;
    const update = () => setDetectedConnection(readConnectionType());
    connection.addEventListener("change", update);
    const frame = window.requestAnimationFrame(update);
    return () => {
      window.cancelAnimationFrame(frame);
      connection.removeEventListener?.("change", update);
    };
  }, [options.connectionType]);

  useEffect(() => {
    if (options.online !== undefined) return;
    const update = () => setDetectedOnline(isOnline());
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const frame = window.requestAnimationFrame(update);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [options.online]);

  const effectiveConnection = options.connectionType !== undefined ? options.connectionType : detectedConnection;
  const effectiveOnline = options.online !== undefined ? options.online : detectedOnline;

  /**
   * Shared gate for download and retry. Consent is scoped to the single attempt
   * that carries it: no session-wide Wi-Fi bypass is ever stored.
   */
  const gateAttempt = useCallback(
    (consent: boolean): DownloadAttemptResult | null => {
      if (!effectiveOnline) {
        return { ok: false, record: null, reason: "OFFLINE", message: "Aucune connexion réseau." };
      }
      if (!options.wifiOnly || consent) return null;
      if (effectiveConnection !== null && effectiveConnection !== "wifi") {
        return { ok: false, record: null, reason: "WIFI_ONLY", message: "Téléchargement réservé au Wi-Fi." };
      }
      if (effectiveConnection === null) {
        return {
          ok: false,
          record: null,
          reason: "WIFI_CONSENT_REQUIRED",
          needsConsent: true,
          message: "Le type de connexion est inconnu. Confirmez le téléchargement.",
        };
      }
      return null;
    },
    [effectiveConnection, effectiveOnline, options.wifiOnly],
  );

  const download = useCallback<UseDownloadsResult["download"]>(
    async (content, asset, quality, overrides = {}) => {
      const gate = gateAttempt(overrides.consent === true);
      if (gate) return gate;
      const result = await store.download({
        content,
        asset,
        quality: quality ?? options.quality,
        rights: overrides.rights ?? rights,
        variants: overrides.variants ?? variants,
      });
      if (!result.ok && result.message) setError(result.message);
      setRecords(store.snapshot());
      return result;
    },
    [gateAttempt, options.quality, rights, store, variants],
  );

  const cancel = useCallback(async (id: string) => {
    const record = await store.cancel(id);
    setRecords(store.snapshot());
    return record;
  }, [store]);

  const remove = useCallback(async (id: string) => {
    const removed = await store.remove(id);
    setRecords(store.snapshot());
    return removed;
  }, [store]);

  const retry = useCallback<UseDownloadsResult["retry"]>(
    async (id, overrides = {}) => {
      // Retry follows exactly the same Wi-Fi and online gate as a fresh download.
      const gate = gateAttempt(overrides.consent === true);
      if (gate) return gate;
      const result = await store.retry(id, {
        rights: overrides.rights ?? rights,
        variants: overrides.variants ?? variants,
        assets: catalog.assets,
        asset: overrides.asset,
        content: overrides.content,
      });
      if (!result.ok && result.message) setError(result.message);
      setRecords(store.snapshot());
      return result;
    },
    [catalog.assets, gateAttempt, rights, store, variants],
  );

  const recordFor = useCallback<UseDownloadsResult["recordFor"]>(
    (contentId, mediaAssetId, quality) => store.snapshot().find((record) =>
      record.contentId === contentId
      && record.mediaAssetId === mediaAssetId
      && (!quality || record.quality === quality),
    ) ?? null,
    [store],
  );

  const clearError = useCallback(() => setError(null), []);
  const storageEstimate = useCallback(() => store.storageEstimate(), [store]);

  return {
    records,
    loading,
    ready,
    supported: store.isSupported,
    error,
    download,
    cancel,
    remove,
    retry,
    refresh,
    storageEstimate,
    clearError,
    recordFor,
    progressOf: downloadProgressRatio,
  };
}
