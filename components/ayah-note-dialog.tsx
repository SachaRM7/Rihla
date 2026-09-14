"use client";

import { StickyNote, Trash2, X } from "lucide-react";
import { useState } from "react";

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

  return (
    <div className="note-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="note-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ayah-note-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <span className="note-dialog-icon" aria-hidden="true"><StickyNote size={19} /></span>
          <div>
            <p>{surahName} · {surahNumber}:{ayahNumber}</p>
            <h2 id="ayah-note-title">Note personnelle</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fermer l’éditeur">
            <X size={20} />
          </button>
        </header>

        <label className="note-field">
          <span>Votre réflexion</span>
          <textarea
            value={draft}
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
                <Trash2 size={16} /> Supprimer
              </button>
            )}
          </div>
          <div className="note-dialog-actions">
            <button type="button" className="secondary-action" onClick={onClose}>Annuler</button>
            <button type="button" className="primary-action" onClick={() => onSave(draft)}>Enregistrer</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
