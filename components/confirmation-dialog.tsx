"use client";

import { useId, useState, type ReactNode } from "react";
import { useModalAccessibility } from "@/hooks/use-modal-accessibility";

type Props = {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export function ConfirmationDialog({ title, children, confirmLabel, onConfirm, onClose }: Props) {
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { dialogRef, onDialogKeyDown, requestClose } = useModalAccessibility({ onClose, canClose: () => !busy });
  return <div className="note-dialog-backdrop" role="presentation" onMouseDown={requestClose}>
    <section className="note-dialog download-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onKeyDown={onDialogKeyDown} onMouseDown={(event) => event.stopPropagation()}>
      <h2 id={titleId}>{title}</h2>
      {children}
      {error && <p role="alert">{error}</p>}
      <footer className="download-actions">
        <button type="button" className="secondary-action" disabled={busy} onClick={requestClose}>Annuler</button>
        <button type="button" className="primary-action" disabled={busy} onClick={async () => {
          setBusy(true);
          setError(null);
          try { await onConfirm(); onClose(); }
          catch (cause) { setError(cause instanceof Error ? cause.message : "L’action a échoué. Réessayez."); }
          finally { setBusy(false); }
        }}>{busy ? "En cours…" : confirmLabel}</button>
      </footer>
    </section>
  </div>;
}
