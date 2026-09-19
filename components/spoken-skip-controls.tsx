"use client";

import { RotateCcw, RotateCw } from "lucide-react";

type Props = { onBack: () => void; onForward: () => void; seconds?: number };

export function SpokenSkipControls({ onBack, onForward, seconds = 15 }: Props) {
  return <div className="spoken-skip-controls" aria-label="Navigation temporelle">
    <button type="button" onClick={onBack} aria-label={`Reculer de ${seconds} secondes`}><RotateCcw size={19}/><span>{seconds}</span></button>
    <button type="button" onClick={onForward} aria-label={`Avancer de ${seconds} secondes`}><RotateCw size={19}/><span>{seconds}</span></button>
  </div>;
}
