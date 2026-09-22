"use client";

import { useMemo, useState } from "react";
import { useModalAccessibility } from "@/hooks/use-modal-accessibility";
import { qualityLabels } from "@/components/download-library";
import { formatDownloadSize, normalizeDownloadQuality } from "@/lib/offline";
import type { ContentItem, MediaAsset, MediaVariant } from "@/lib/domain";
import type { DownloadQuality, DownloadQualityInput } from "@/lib/download-types";

type Props = {
  content: ContentItem;
  asset: MediaAsset;
  variants: MediaVariant[];
  preference: DownloadQualityInput;
  wifiOnly: boolean;
  onClose: () => void;
  onDownload: (quality: DownloadQuality, consent: boolean) => void;
};

export function DownloadOptionsDialog({ content, asset, variants, preference, wifiOnly, onClose, onDownload }: Props) {
  const options = useMemo(() => {
    const siblings = variants.filter((variant) => variant.mediaAssetId === asset.id && variant.kind === asset.kind);
    return siblings.length ? siblings.map((variant) => ({ quality: variant.quality ?? "STANDARD", size: variant.sizeBytes })) : [{ quality: "STANDARD" as const, size: asset.sizeBytes }];
  }, [asset, variants]);
  const [quality, setQuality] = useState<DownloadQuality>(() => options.find((option) => option.quality === normalizeDownloadQuality(preference))?.quality ?? options[0].quality);
  const [consent, setConsent] = useState(false);
  const connection = typeof navigator === "undefined" ? undefined : (navigator as Navigator & { connection?: { type?: string } }).connection;
  const unknownNetwork = wifiOnly && (!connection?.type || connection.type === "unknown");
  const blockedNetwork = wifiOnly && Boolean(connection?.type && connection.type !== "wifi" && connection.type !== "unknown");
  const { dialogRef, onDialogKeyDown, requestClose } = useModalAccessibility({ onClose });
  return <div className="note-dialog-backdrop" role="presentation" onMouseDown={requestClose}>
    <section className="note-dialog download-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="download-options-title" onKeyDown={onDialogKeyDown} tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
      <h2 id="download-options-title">Télécharger sur cet appareil</h2>
      <p>{content.title}</p>
      <label className="download-quality">Qualité disponible
        <select value={quality} onChange={(event) => setQuality(event.target.value as DownloadQuality)}>
          {options.map((option) => <option value={option.quality} key={option.quality}>{qualityLabels[option.quality]} · {formatDownloadSize(option.size)}</option>)}
        </select>
      </label>
      {options.length === 1 && <p>La source ne propose qu’une qualité pour ce média.</p>}
      {unknownNetwork && <label className="download-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)}/><span>Le navigateur ne peut pas vérifier le Wi-Fi. J’autorise ce téléchargement sur ma connexion actuelle, qui peut utiliser des données mobiles.</span></label>}
      {blockedNetwork && <p role="alert">L’option « Wi-Fi uniquement » est active. Connectez-vous au Wi-Fi ou modifiez ce réglage dans les préférences.</p>}
      <footer className="download-actions">
        <button type="button" className="secondary-action" onClick={requestClose}>Annuler</button>
        <button type="button" className="primary-action" disabled={blockedNetwork || (unknownNetwork && !consent)} onClick={() => { onDownload(quality, consent); onClose(); }}>Télécharger</button>
      </footer>
    </section>
  </div>;
}
