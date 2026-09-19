"use client";

import { ChevronUp, LoaderCircle, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import type { PlaybackStatus } from "@/hooks/use-quran-player";
import type { SurahDetail } from "@/lib/quran/types";

type Props = {
  detail: SurahDetail | null;
  activeIndex: number;
  status: PlaybackStatus;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onOpen: () => void;
  onToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
};

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function MiniPlayer({
  detail,
  activeIndex,
  status,
  isPlaying,
  currentTime,
  duration,
  onOpen,
  onToggle,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
}: Props) {
  if (!detail) return null;
  const ayah = detail.ayahs[activeIndex];
  if (!ayah) return null;

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const busy = status === "loading" || status === "buffering";

  return (
    <aside className="mini-player" aria-label="Lecteur en cours">
      <button type="button" className="mini-player-main" onClick={onOpen} aria-label="Ouvrir le lecteur complet">
        <span className="mini-artwork" aria-hidden="true">
          <span>{String(detail.surah.number).padStart(3, "0")}</span>
          <i />
        </span>
        <span className="mini-copy">
          <span className="mini-title-row">
            <strong>{detail.surah.englishName} · Ayah {ayah.numberInSurah}</strong>
            <time>{formatTime(currentTime)}</time>
          </span>
          <small>{status === "buffering" ? "Connexion en cours…" : status === "error" ? "Lecture indisponible" : detail.reciterName}</small>
        </span>
        <ChevronUp className="mini-chevron" size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="player-icon-button mini-previous"
        onClick={onPrevious}
        aria-label="Ayah précédente"
        disabled={!canPrevious}
      >
        <SkipBack size={18} fill="currentColor" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="player-icon-button primary"
        onClick={onToggle}
        aria-label={isPlaying ? "Mettre en pause" : "Lire"}
        disabled={status === "loading"}
      >
        {busy ? <LoaderCircle className="spin" size={19} aria-hidden="true" /> : isPlaying ? <Pause size={19} fill="currentColor" aria-hidden="true" /> : <Play size={19} fill="currentColor" aria-hidden="true" />}
      </button>
      <button
        type="button"
        className="player-icon-button mini-next"
        onClick={onNext}
        aria-label="Ayah suivante"
        disabled={!canNext}
      >
        <SkipForward size={18} fill="currentColor" aria-hidden="true" />
      </button>
      <span className="mini-progress" style={{ width: `${progress}%` }} aria-hidden="true" />
    </aside>
  );
}
