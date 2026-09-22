"use client";

import { Download, Play, RefreshCw, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { downloadProgressRatio, downloadStatusLabels, formatDownloadSize } from "@/lib/offline";
import type { DownloadRecord, StorageEstimate } from "@/lib/download-types";

export const qualityLabels = { DATA_SAVER: "Économe", STANDARD: "Standard", HIGH: "Haute qualité" } as const;

type Props = {
  records: DownloadRecord[];
  loading: boolean;
  error: string | null;
  estimate: StorageEstimate | null;
  online: boolean;
  onPlay: (contentId: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => Promise<void>;
  onRetry: (record: DownloadRecord) => void;
  onRefresh: () => void;
  onBrowse: () => void;
};

export function DownloadLibrary({ records, loading, error, estimate, online, onPlay, onCancel, onRemove, onRetry, onRefresh, onBrowse }: Props) {
  const [deleting, setDeleting] = useState<DownloadRecord | null>(null);
  const bytes = records.reduce((total, record) => total + (record.sizeBytes ?? 0), 0);
  return <section className="library-section download-library" aria-labelledby="downloads-title">
    <div className="section-title-row">
      <h2 id="downloads-title">Téléchargements</h2>
      <button type="button" className="text-action" onClick={onRefresh} disabled={loading}><RefreshCw size={16} aria-hidden="true"/>Vérifier</button>
    </div>
    <p className="download-storage">{records.length ? `${formatDownloadSize(bytes)} de médias sur cet appareil.` : "Les fichiers restent sur cet appareil, sans synchronisation cloud."}
      {estimate?.available != null && ` Espace estimé disponible : ${formatDownloadSize(estimate.available)}.`}
    </p>
    <p className="download-policy">Le navigateur peut libérer ce stockage. Les récitations et textes Coran provenant des API ne sont pas téléchargés ; seuls les médias dont les droits le permettent sont proposés ici.</p>
    {loading && <p role="status">Vérification des fichiers locaux…</p>}
    {error && <p className="download-error" role="alert">{error} Utilisez « Vérifier » pour réessayer.</p>}
    {!loading && !records.length && <div className="empty-library compact"><Download size={24} aria-hidden="true"/><strong>Aucun fichier téléchargé</strong><p>Choisissez « Télécharger » dans les contenus disponibles avant de partir hors connexion.</p><button type="button" className="secondary-action" onClick={onBrowse}>Parcourir les contenus</button></div>}
    <ul className="download-list">
      {records.map((record) => {
        const progress = downloadProgressRatio(record);
        const busy = record.status === "DOWNLOADING";
        return <li className="download-row" key={record.id}>
          <div className="download-copy">
            <h3>{record.title}</h3>
            <p>{qualityLabels[record.quality]} · {downloadStatusLabels[record.status]}</p>
            <p>{formatDownloadSize(record.sizeBytes ?? record.receivedBytes)}{busy && record.totalBytes ? ` / ${formatDownloadSize(record.totalBytes)}` : ""}</p>
            {busy && <progress value={progress ?? undefined} max={1} aria-label={`Téléchargement de ${record.title}`}/>}
            {record.error && <p className="download-error">{record.error}</p>}
          </div>
          <div className="download-actions">
            {record.status === "AVAILABLE" && <button type="button" className="secondary-action" onClick={() => onPlay(record.contentId)} aria-label={`Écouter ${record.title}`}><Play size={16} aria-hidden="true"/>Écouter</button>}
            {busy ? <button type="button" className="secondary-action" onClick={() => onCancel(record.id)} aria-label={`Annuler le téléchargement de ${record.title}`}><X size={16} aria-hidden="true"/>Annuler</button>
              : <>
                {record.status !== "AVAILABLE" && <button type="button" className="secondary-action" disabled={!online} onClick={() => onRetry(record)}><RefreshCw size={16} aria-hidden="true"/>{record.status === "STALE" ? "Mettre à jour" : "Télécharger à nouveau"}</button>}
                <button type="button" className="secondary-action" onClick={() => setDeleting(record)} aria-label={`Supprimer le téléchargement de ${record.title}`}><Trash2 size={16} aria-hidden="true"/>Supprimer</button>
              </>}
          </div>
        </li>;
      })}
    </ul>
    {deleting && <ConfirmationDialog title="Supprimer ce téléchargement ?" confirmLabel="Supprimer le fichier" onClose={() => setDeleting(null)} onConfirm={() => onRemove(deleting.id)}>
      <p>« {deleting.title} » sera retiré de cet appareil. Vos notes et votre progression seront conservées.</p>
    </ConfirmationDialog>}
  </section>;
}
