"use client";

import {
  Heart,
  LoaderCircle,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import type { PlaybackStatus } from "@/hooks/use-quran-player";
import { RECITERS } from "@/lib/quran/constants";
import type { SurahDetail } from "@/lib/quran/types";
import { formatTime } from "./mini-player";

type Props = {
  detail: SurahDetail;
  activeIndex: number;
  status: PlaybackStatus;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
  reciterId: string;
  isFavorite: boolean;
  canPrevious: boolean;
  canNext: boolean;
  onClose: () => void;
  onToggle: () => void;
  onSeek: (value: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onRetry: () => void;
  onReciterChange: (id: string) => void;
  onToggleFavorite: () => void;
  onShowText: () => void;
};

export function FullPlayer({
  detail,
  activeIndex,
  status,
  isPlaying,
  currentTime,
  duration,
  error,
  reciterId,
  isFavorite,
  canPrevious,
  canNext,
  onClose,
  onToggle,
  onSeek,
  onPrevious,
  onNext,
  onRetry,
  onReciterChange,
  onToggleFavorite,
  onShowText,
}: Props) {
  const ayah = detail.ayahs[activeIndex];
  if (!ayah) return null;

  return (
    <div className="player-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="full-player"
        role="dialog"
        aria-modal="true"
        aria-labelledby="full-player-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="full-player-header">
          <div>
            <p>Récitation en cours</p>
            <h2 id="full-player-title">{detail.surah.englishName}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fermer le lecteur">
            <X size={21} />
          </button>
        </header>

        <div className="player-artwork" aria-hidden="true">
          <span className="art-number">{String(detail.surah.number).padStart(3, "0")}</span>
          <span className="art-arabic" lang="ar" dir="rtl" translate="no">{detail.surah.name}</span>
          <span className="art-latin">{detail.surah.frenchName}</span>
        </div>

        <div className="player-track-copy">
          <div>
            <h3>Ayah {ayah.numberInSurah}</h3>
            <p>{detail.reciterName}</p>
          </div>
          <button
            type="button"
            className={`favorite-button ${isFavorite ? "active" : ""}`}
            aria-label={isFavorite ? "Retirer cette ayah des favoris" : "Ajouter cette ayah aux favoris"}
            aria-pressed={isFavorite}
            onClick={onToggleFavorite}
          >
            <Heart size={21} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="player-timeline">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => onSeek(Number(event.target.value))}
            aria-label="Position dans l’ayah"
            disabled={!duration}
            style={{ "--played": `${duration ? (currentTime / duration) * 100 : 0}%` } as React.CSSProperties}
          />
          <div><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
        </div>

        <div className="full-controls">
          <button type="button" onClick={onPrevious} disabled={!canPrevious} aria-label="Ayah précédente">
            <SkipBack size={24} fill="currentColor" />
          </button>
          <button
            type="button"
            className="main-player-button"
            onClick={onToggle}
            disabled={status === "loading"}
            aria-label={isPlaying ? "Mettre en pause" : "Lire"}
          >
            {status === "loading" ? <LoaderCircle className="spin" size={28} /> : isPlaying ? <Pause size={29} fill="currentColor" /> : <Play size={29} fill="currentColor" />}
          </button>
          <button type="button" onClick={onNext} disabled={!canNext} aria-label="Ayah suivante">
            <SkipForward size={24} fill="currentColor" />
          </button>
        </div>

        {error && (
          <div className="audio-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={onRetry}><RotateCcw size={15} /> Réessayer</button>
          </div>
        )}

        <label className="reciter-control">
          <span>Récitateur</span>
          <select value={reciterId} onChange={(event) => onReciterChange(event.target.value)}>
            {RECITERS.map((reciter) => <option value={reciter.id} key={reciter.id}>{reciter.name}</option>)}
          </select>
        </label>

        <button type="button" className="show-quran-button" onClick={onShowText}>
          Afficher le Coran
          <span>{detail.surah.number}:{ayah.numberInSurah}</span>
        </button>
      </section>
    </div>
  );
}
