"use client";

import {
  Gauge,
  Heart,
  LoaderCircle,
  Pause,
  Play,
  Repeat2,
  RotateCcw,
  Share2,
  SkipBack,
  SkipForward,
  Timer,
  X,
} from "lucide-react";
import type { PlaybackStatus } from "@/hooks/use-quran-player";
import {
  PLAYBACK_RATES,
  type PlaybackRate,
  type RepeatMode,
  type StudyLoopPreference,
} from "@/lib/preferences";
import { RECITERS } from "@/lib/quran/constants";
import type { SurahDetail } from "@/lib/quran/types";
import { formatTime } from "./mini-player";
import { StudyLoopControl } from "./study-loop-control";
import { useModalAccessibility } from "@/hooks/use-modal-accessibility";

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
  playbackRate: PlaybackRate;
  repeatMode: RepeatMode;
  repeatIteration: number;
  studyLoop: StudyLoopPreference | null;
  studyLoopIteration: number;
  sleepTimerRemaining: number;
  onClose: () => void;
  onToggle: () => void;
  onSeek: (value: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onRetry: () => void;
  onReciterChange: (id: string) => void;
  onToggleFavorite: () => void;
  onShowText: () => void;
  onPlaybackRateChange: (rate: PlaybackRate) => void;
  onRepeatModeChange: (mode: RepeatMode) => void;
  onApplyStudyLoop: (value: StudyLoopPreference) => void;
  onStopStudyLoop: () => void;
  onSetSleepTimer: (minutes: number | null) => void;
  onSetSleepAtEnd: (mode: "ayah" | "surah" | null) => void;
  onShare: () => void;
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
  playbackRate,
  repeatMode,
  repeatIteration,
  studyLoop,
  studyLoopIteration,
  sleepTimerRemaining,
  onClose,
  onToggle,
  onSeek,
  onPrevious,
  onNext,
  onRetry,
  onReciterChange,
  onToggleFavorite,
  onShowText,
  onPlaybackRateChange,
  onRepeatModeChange,
  onApplyStudyLoop,
  onStopStudyLoop,
  onSetSleepTimer,
  onSetSleepAtEnd,
  onShare,
}: Props) {
  const { dialogRef, onDialogKeyDown, requestClose } = useModalAccessibility({ onClose });
  const ayah = detail.ayahs[activeIndex];
  if (!ayah) return null;
  const busy = status === "loading" || status === "buffering";
  const sleepTimerActive = sleepTimerRemaining > 0;
  const sleepTimerMinutes = Math.max(1, Math.ceil(sleepTimerRemaining / 60));

  return (
    <div className="player-backdrop" role="presentation" onMouseDown={requestClose}>
      <section
        ref={dialogRef}
        className="full-player"
        role="dialog"
        aria-modal="true"
        aria-labelledby="full-player-title"
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="full-player-header">
          <div>
            <p>Récitation en cours</p>
            <h2 id="full-player-title">{detail.surah.englishName}</h2>
          </div>
          <button type="button" className="icon-button" onClick={requestClose} aria-label="Fermer le lecteur">
            <X size={21} aria-hidden="true" />
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
            <p>{status === "buffering" ? "Mise en mémoire tampon…" : detail.reciterName}</p>
            {studyLoop ? (
              <span className="repeat-progress">
                A–B {studyLoop.startAyah}–{studyLoop.endAyah} · {studyLoop.cycles === "continuous" ? `passage ${studyLoopIteration}` : `${studyLoopIteration}/${studyLoop.cycles}`}
              </span>
            ) : repeatMode !== "off" && (
              <span className="repeat-progress">
                {repeatMode === "continuous" ? "Boucle continue" : `Passage ${repeatIteration}/${repeatMode}`}
              </span>
            )}
          </div>
          <div className="player-track-actions">
            <button type="button" className="icon-button" aria-label="Partager cette ayah" onClick={onShare}>
              <Share2 size={19} />
            </button>
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
        </div>

        <div className="player-timeline">
          <input
            type="range"
            name="ayah-position"
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
            {busy ? <LoaderCircle className="spin" size={28} /> : isPlaying ? <Pause size={29} fill="currentColor" /> : <Play size={29} fill="currentColor" />}
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

        <div className="player-options" aria-label="Options de lecture">
          <label className="player-option">
            <span><Gauge size={16} /> Vitesse</span>
            <select
              name="playback-rate"
              autoComplete="off"
              value={playbackRate}
              onChange={(event) => onPlaybackRateChange(Number(event.target.value) as PlaybackRate)}
            >
              {PLAYBACK_RATES.map((rate) => <option value={rate} key={rate}>{rate}×</option>)}
            </select>
          </label>
          <label className={`player-option ${repeatMode !== "off" ? "active" : ""}`}>
            <span><Repeat2 size={16} /> Répéter</span>
            <select
              name="repeat-mode"
              autoComplete="off"
              value={repeatMode}
              onChange={(event) => onRepeatModeChange(event.target.value as RepeatMode)}
            >
              <option value="off">Off</option>
              <option value="3">3 fois</option>
              <option value="5">5 fois</option>
              <option value="10">10 fois</option>
              <option value="continuous">Continu</option>
            </select>
          </label>
          <label className="player-option">
            <span><Timer size={16} /> Minuterie</span>
            <select
              name="sleep-timer"
              autoComplete="off"
              value={sleepTimerActive ? "active" : "off"}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "end-ayah" || value === "end-surah") onSetSleepAtEnd(value === "end-ayah" ? "ayah" : "surah");
                else { onSetSleepAtEnd(null); onSetSleepTimer(value === "off" ? null : Number(value)); }
              }}
            >
              <option value="off">Off</option>
              {sleepTimerActive && <option value="active">{sleepTimerMinutes} min</option>}
              <option value="5">5 min</option>
              <option value="10">10 min</option>
              <option value="20">20 min</option>
              <option value="30">30 min</option>
              <option value="end-ayah">Fin du verset</option>
              <option value="end-surah">Fin de la sourate</option>
            </select>
          </label>
        </div>

        <StudyLoopControl
          key={detail.surah.number}
          surahNumber={detail.surah.number}
          ayahCount={detail.ayahs.length}
          activeAyah={ayah.numberInSurah}
          value={studyLoop}
          iteration={studyLoopIteration}
          onApply={onApplyStudyLoop}
          onStop={onStopStudyLoop}
        />

        <label className="reciter-control">
          <span>Récitateur</span>
          <select name="player-reciter" autoComplete="off" value={reciterId} onChange={(event) => onReciterChange(event.target.value)}>
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
