"use client";
import { useModalAccessibility } from "@/hooks/use-modal-accessibility";
export function PlaylistTransitionDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const { dialogRef, onDialogKeyDown, requestClose } = useModalAccessibility({ onClose });
  return <div className="note-modal-backdrop" onMouseDown={requestClose}>
    <section className="note-modal" role="dialog" aria-modal="true" aria-labelledby="playlist-transition-title" ref={dialogRef} tabIndex={-1} onKeyDown={onDialogKeyDown} onMouseDown={e => e.stopPropagation()}>
      <h2 id="playlist-transition-title">Continuer avec un autre type de contenu ?</h2>
      <p>Le prochain élément fait passer du Coran aux contenus parlés, ou inversement. Votre préférence de lecture automatique reste inchangée.</p>
      <div className="study-loop-actions">
        <button className="secondary-action" type="button" onClick={requestClose}>Arrêter ici</button>
        <button className="primary-action" type="button" onClick={onConfirm}>Continuer la playlist</button>
      </div>
    </section>
  </div>;
}
