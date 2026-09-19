"use client";

import { CheckCircle2, Download, LoaderCircle } from "lucide-react";
import { formatDownloadSize } from "@/lib/offline";

type Props = { allowed: boolean; status?: "QUEUED"|"DOWNLOADING"|"AVAILABLE"|"ERROR"; sizeBytes?: number; onDownload:()=>void };

export function OfflineDownloadControl({ allowed, status, sizeBytes, onDownload }: Props) {
  if (!allowed) return null;
  if (status === "AVAILABLE") return <span className="offline-available"><CheckCircle2 size={16}/>Disponible hors connexion · {formatDownloadSize(sizeBytes)}</span>;
  const busy = status === "DOWNLOADING" || status === "QUEUED";
  return <button type="button" className="secondary-action offline-download" disabled={busy} onClick={onDownload}>{busy ? <LoaderCircle className="spin" size={16}/> : <Download size={16}/>} {status === "ERROR" ? "Réessayer" : "Télécharger"}{sizeBytes ? " · " + formatDownloadSize(sizeBytes) : ""}</button>;
}
