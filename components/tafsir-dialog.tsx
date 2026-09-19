"use client";

import { useModalAccessibility } from "@/hooks/use-modal-accessibility";
import type { SourceAttribution } from "@/lib/quran/types";
import { SourceDisclosure } from "@/components/source-disclosure";

type Props = { surahNumber: number; ayahNumber: number; source: SourceAttribution; onClose: () => void };

export function TafsirDialog({ surahNumber, ayahNumber, source, onClose }: Props) {
  const { dialogRef, onDialogKeyDown, requestClose } = useModalAccessibility({ onClose });
  return <div className="note-modal-backdrop" role="presentation" onMouseDown={requestClose}>
    <section ref={dialogRef} tabIndex={-1} className="note-modal tafsir-modal" role="dialog" aria-modal="true" aria-labelledby="tafsir-title" onKeyDown={onDialogKeyDown} onMouseDown={(event)=>event.stopPropagation()}>
      <div className="section-title-row"><div><p className="eyebrow">Sourate {surahNumber} · Ayah {ayahNumber}</p><h2 id="tafsir-title">Tafsir & sources</h2></div><button type="button" className="icon-button" aria-label="Fermer le tafsir et les sources" onClick={requestClose}>×</button></div>
      <p>Le texte coranique, sa traduction et le commentaire restent séparés. Aucun commentaire n’est affiché tant qu’une source de tafsir autorisée et clairement attribuée n’est pas connectée.</p>
      <SourceDisclosure source={source} compact />
    </section>
  </div>;
}
