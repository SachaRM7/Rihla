"use client";

import { CheckCircle2, Download, LoaderCircle } from "lucide-react";
import { formatDownloadSize } from "@/lib/offline";
import type { DownloadStatus } from "@/lib/download-types";

type Props = { allowed: boolean; status?: DownloadStatus | "QUEUED"; sizeBytes?: number; onDownload:()=>void };

export function OfflineDownloadControl({ allowed, status, sizeBytes, onDownload }: Props) {
  if (!allowed) return null;
  if (status === "AVAILABLE") return <span className="offline-available"><CheckCircle2 size={16}/>Disponible hors connexion · {formatDownloadSize(sizeBytes)}</span>;
  const busy = status === "DOWNLOADING" || status === "QUEUED";
  return <button type="button" className="secondary-action offline-download" disabled={busy} onClick={onDownload}>{busy ? <LoaderCircle className="spin" size={16}/> : <Download size={16}/>} {busy ? "Téléchargement en cours" : status === "ERROR" || status === "MISSING" ? "Réessayer" : status === "STALE" ? "Mettre à jour" : "Télécharger"}{sizeBytes ? " · " + formatDownloadSize(sizeBytes) : ""}</button>;
}
