"use client";

import { StickyNote, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useModalAccessibility } from "@/hooks/use-modal-accessibility";

type Props = {
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
};

export function AyahNoteDialog({
  surahName,
  surahNumber,
  ayahNumber,
  initialValue,
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState(initialValue);
  const { dialogRef, onDialogKeyDown, requestClose } = useModalAccessibility({
    onClose,
    canClose: () => draft === initialValue || window.confirm("Ignorer les modifications de cette note ?"),
  });

  return (
    <div className="note-dialog-backdrop" role="presentation" onMouseDown={requestClose}>
      <section
        ref={dialogRef}
        className="note-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ayah-note-title"
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <span className="note-dialog-icon" aria-hidden="true"><StickyNote size={19} /></span>
          <div>
            <p>{surahName} · {surahNumber}:{ayahNumber}</p>
            <h2 id="ayah-note-title">Note personnelle</h2>
          </div>
          <button type="button" className="icon-button" onClick={requestClose} aria-label="Fermer l’éditeur">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <label className="note-field">
          <span>Votre réflexion</span>
          <textarea
            value={draft}
            name="ayah-note"
            autoComplete="off"
            maxLength={2000}
            rows={7}
            placeholder="Écrivez une réflexion, une question ou un rappel privé…"
            onChange={(event) => setDraft(event.target.value)}
          />
          <small>{draft.length}/2000 · enregistrée uniquement sur cet appareil</small>
        </label>

        <footer>
          <div>
            {initialValue && (
              <button
                type="button"
                className="note-delete"
                onClick={() => {
                  if (window.confirm("Supprimer cette note personnelle ?")) onSave("");
                }}
              >
                <Trash2 size={16} aria-hidden="true" /> Supprimer
              </button>
            )}
          </div>
          <div className="note-dialog-actions">
            <button type="button" className="secondary-action" onClick={requestClose}>Annuler</button>
            <button type="button" className="primary-action" onClick={() => onSave(draft)}>Enregistrer</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
