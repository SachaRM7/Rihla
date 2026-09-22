"use client";

import { ListPlus, LoaderCircle, Minimize2, Pause, Play, RotateCcw, SkipBack, SkipForward, Timer, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { ContentItem, MediaAsset, MediaChapter, MediaKind, MediaVariant, Transcript, TranscriptSegment } from "@/lib/domain";
import type { PlaybackRate } from "@/lib/preferences";
import { clearMediaSession, setMediaSessionMetadata, setMediaSessionPlayback } from "@/lib/media-session";
import { mediaUrlForKind } from "@/lib/media-variants";
import { useSpokenMedia } from "@/hooks/use-spoken-media";
import { MediaModeSwitch } from "@/components/media-mode-switch";
import { MediaChapters } from "@/components/media-chapters";
import { TimedTranscript } from "@/components/timed-transcript";
import { SpokenSkipControls } from "@/components/spoken-skip-controls";
import { formatTime } from "@/components/mini-player";

type Props = {
  content: ContentItem;
  asset: MediaAsset;
  variants?: MediaVariant[];
  playbackRate: PlaybackRate;
  transcript?: Transcript;
  transcriptSegments?: TranscriptSegment[];
  chapters?: MediaChapter[];
  initialPositionMs?: number;
  autoplay?: boolean;
  compact?: boolean;
  artist?: string;
  onOpen?: () => void;
  onMinimize?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canPrevious?: boolean;
  canNext?: boolean;
  onQueue?: () => void;
  onProgress?: (positionMs: number, durationMs: number) => void;
  onEnded?: () => void;
  onReportIssue?: (kind: "TEXT" | "TIMING" | "SOURCE" | "UNAVAILABLE", note?: string) => void;
  onClose: () => void;
};

const MEDIA_SESSION_ACTIONS: MediaSessionAction[] = [
  "play",
  "pause",
  "previoustrack",
  "nexttrack",
  "seekbackward",
  "seekforward",
  "seekto",
];

export function UniversalSpokenPlayer({
  content,
  asset,
  variants = [],
  playbackRate,
  transcript,
  transcriptSegments = [],
  chapters = [],
  initialPositionMs = 0,
  autoplay = false,
  compact = false,
  artist,
  onOpen,
  onMinimize,
  onPrevious,
  onNext,
  canPrevious = false,
  canNext = false,
  onQueue,
  onProgress,
  onEnded,
  onReportIssue,
  onClose,
}: Props) {
  const [mediaKind, setMediaKind] = useState<MediaKind>(asset.kind);
  const [sleepMinutes, setSleepMinutes] = useState<number | null>(null);
  const [sleepAtEnd, setSleepAtEnd] = useState(false);
  const owner = useId();
  const previousRef = useRef(onPrevious);
  const nextRef = useRef(onNext);
  useEffect(() => { previousRef.current = onPrevious; nextRef.current = onNext; }, [onNext, onPrevious]);
  const audioUrl = mediaUrlForKind(asset, variants, "AUDIO");
  const videoUrl = mediaUrlForKind(asset, variants, "VIDEO");
  const { mediaRef, setMediaRef, handlers, position, duration, playing, loading, error, play: playCurrentMedia, pause, toggle: toggleCurrentMedia, seek, retry, save, prepareSwitch } = useSpokenMedia({
    url: mediaKind === "VIDEO" ? videoUrl : audioUrl, kind: mediaKind, initialPositionMs, durationMs: asset.durationMs, playbackRate, autoplay, onProgress,
    onEnded: () => { if (sleepAtEnd) setSleepAtEnd(false); else onEnded?.(); },
  });

  useEffect(() => {
    setMediaSessionPlayback({
      owner,
      state: playing ? "playing" : loading ? "none" : "paused",
      duration,
      position,
      playbackRate,
    });
  }, [duration, loading, owner, playbackRate, playing, position]);

  useEffect(() => {
    const actions: Partial<Record<MediaSessionAction, MediaSessionActionHandler | null>> = {
      play: playCurrentMedia,
      pause,
      previoustrack: canPrevious ? () => previousRef.current?.() : null,
      nexttrack: canNext ? () => nextRef.current?.() : null,
      seekbackward: () => seek((mediaRef.current?.currentTime ?? 0) - 15),
      seekforward: () => seek((mediaRef.current?.currentTime ?? 0) + 15),
      seekto: (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime);
      },
    };
    setMediaSessionMetadata({
      title: content.title,
      owner,
      artist: artist ?? "RIHLA",
      album: "RIHLA · Contenu parlé",
      artworkUrl: content.artworkUrl,
      actions,
    });
    return () => clearMediaSession(MEDIA_SESSION_ACTIONS, owner);
  }, [artist, canNext, canPrevious, content.artworkUrl, content.title, mediaRef, owner, pause, playCurrentMedia, seek]);

  useEffect(() => {
    if (sleepMinutes === null) return;
    const deadline = Date.now() + sleepMinutes * 60_000;
    const timer = window.setInterval(() => {
      if (Date.now() >= deadline) {
        pause();
        setSleepMinutes(null);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [pause, sleepMinutes]);

  const switchMedia = (kind: MediaKind) => {
    if (kind === mediaKind) return;
    prepareSwitch();
    setMediaKind(kind);
  };
  const audioAvailable = Boolean(audioUrl);
  const videoAvailable = Boolean(videoUrl);
  const busy = loading;

  return (
    <section className={`spoken-player ${compact ? "spoken-player-compact" : "spoken-player-expanded"}`} aria-label="Lecteur de contenu parlé">
      {mediaKind === "AUDIO" ? <audio ref={setMediaRef} className="spoken-audio" preload="metadata" {...handlers}/>
      : <video
        ref={setMediaRef}
        className={mediaKind === "VIDEO" && !compact ? "spoken-video active" : "spoken-video"}
        playsInline
        controls={false}
        preload="metadata"
        {...handlers}
      />}

      {compact ? (
        <div className="spoken-mini-player">
          <button type="button" className="spoken-mini-main" onClick={onOpen} aria-label="Ouvrir le lecteur complet">
            <span className="spoken-mini-artwork" aria-hidden="true">
              <span>{content.title.slice(0, 1).toUpperCase()}</span>
            </span>
            <span className="spoken-mini-copy">
              <span className="spoken-mini-title"><strong>{content.title}</strong><time>{formatTime(position)}</time></span>
              <small>{loading ? "Mise en mémoire tampon…" : error ? "Lecture indisponible" : content.description ?? "Contenu parlé"}</small>
            </span>
          </button>
          <button type="button" className="player-icon-button mini-previous" onClick={onPrevious} disabled={!onPrevious || !canPrevious} aria-label="Contenu précédent"><SkipBack size={18} fill="currentColor" /></button>
          <button type="button" className="player-icon-button primary" onClick={toggleCurrentMedia} aria-label={playing ? "Mettre en pause" : "Lire"} disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={19} /> : playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
          </button>
          <button type="button" className="player-icon-button mini-next" onClick={onNext} disabled={!onNext || !canNext} aria-label="Contenu suivant"><SkipForward size={18} fill="currentColor" /></button>
          <span className="mini-progress" style={{ width: `${duration > 0 ? Math.min(100, (position / duration) * 100) : 0}%` }} aria-hidden="true" />
        </div>
      ) : (
        <>
          <header>
            <div><p className="eyebrow">En cours</p><h2>{content.title}</h2></div>
            <div className="spoken-player-header-actions">
              {onQueue && <button type="button" className="queue-add-action" onClick={onQueue}><ListPlus size={15} /> File</button>}
              {onMinimize && <button type="button" className="icon-button" aria-label="Réduire le lecteur" onClick={onMinimize}><Minimize2 size={18}/></button>}
              <button type="button" className="icon-button" aria-label="Arrêter et fermer le lecteur" onClick={() => { save(); pause(); onClose(); }}><X size={18} /></button>
            </div>
          </header>
          {content.artworkUrl && <div className="spoken-player-artwork" role="img" aria-label={content.artworkAlt ?? content.title} style={{ backgroundImage: `url(${content.artworkUrl})` }} />}
          <MediaModeSwitch active={mediaKind} audioAvailable={audioAvailable} videoAvailable={videoAvailable} onChange={switchMedia} />
          <div className="spoken-player-track">
            <strong>{content.description ?? "Contenu parlé"}</strong>
            <span><time>{formatTime(position)}</time> / <time>{formatTime(duration)}</time></span>
          </div>
          <input type="range" min={0} max={duration || 0} step={1} value={Math.min(position, duration || 0)} onChange={(event) => seek(Number(event.target.value))} aria-label="Position dans le contenu" disabled={!duration} />
          {error && <div className="audio-error" role="alert"><span>{error}</span><button type="button" onClick={retry}><RotateCcw size={14} /> Réessayer</button></div>}
          <div className="spoken-player-controls">
            <button type="button" className="player-icon-button" onClick={onPrevious} disabled={!onPrevious || !canPrevious} aria-label="Contenu précédent"><SkipBack size={20} fill="currentColor" /></button>
            <SpokenSkipControls onBack={() => seek(position - 15)} onForward={() => seek(position + 15)} />
            <button type="button" className="main-player-button" onClick={toggleCurrentMedia} aria-label={playing ? "Mettre en pause" : "Lire"}>
              {busy ? <LoaderCircle className="spin" size={24} /> : playing ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button type="button" className="player-icon-button" onClick={onNext} disabled={!onNext || !canNext} aria-label="Contenu suivant"><SkipForward size={20} fill="currentColor" /></button>
          </div>
          <div className="spoken-sleep"><span><Timer size={15} />Minuterie</span><select aria-label="Minuterie d’arrêt" value={sleepMinutes ?? ""} onChange={(event) => { setSleepAtEnd(false); setSleepMinutes(event.target.value ? Number(event.target.value) : null); }}><option value="">Désactivée</option><option value={10}>10 min</option><option value={20}>20 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option></select><button type="button" className={sleepAtEnd ? "active" : ""} aria-pressed={sleepAtEnd} onClick={() => { setSleepMinutes(null); setSleepAtEnd(!sleepAtEnd); }}>Fin de l’épisode</button></div>
          {chapters.length > 0 && <MediaChapters chapters={chapters} positionMs={position * 1000} onSeek={(ms) => seek(ms / 1000)} />}
          {transcript && transcriptSegments.length > 0 && <TimedTranscript transcript={transcript} segments={transcriptSegments} positionMs={position * 1000} onSeek={(ms) => seek(ms / 1000)} onReportIssue={onReportIssue} />}
        </>
      )}
    </section>
  );
}
