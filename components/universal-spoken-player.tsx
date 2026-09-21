"use client";

import { ListPlus, LoaderCircle, Pause, Play, RotateCcw, SkipBack, SkipForward, Timer, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ContentItem, MediaAsset, MediaChapter, MediaKind, MediaVariant, Transcript, TranscriptSegment } from "@/lib/domain";
import type { PlaybackRate } from "@/lib/preferences";
import { clearMediaSession, setMediaSessionMetadata, setMediaSessionPlayback } from "@/lib/media-session";
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
  onOpen?: () => void;
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
  onOpen,
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const switchPositionRef = useRef<number | null>(null);
  const switchTargetRef = useRef<MediaKind | null>(null);
  const switchResumeRef = useRef(false);
  const [mediaKind, setMediaKind] = useState<MediaKind>(asset.kind);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState(initialPositionMs / 1000);
  const [duration, setDuration] = useState((asset.durationMs ?? 0) / 1000);
  const [error, setError] = useState<string | null>(null);
  const [sleepMinutes, setSleepMinutes] = useState<number | null>(null);
  const [sleepAtEnd, setSleepAtEnd] = useState(false);
  const lastSavedRef = useRef(initialPositionMs);
  const sleepDeadlineRef = useRef<number | null>(null);

  const media = useCallback(() => mediaKind === "VIDEO" ? videoRef.current : audioRef.current, [mediaKind]);

  const seek = useCallback((seconds: number) => {
    const target = media();
    if (!target) return;
    target.currentTime = Math.min(Math.max(seconds, 0), target.duration || seconds);
    setPosition(target.currentTime);
  }, [media]);

  const playCurrentMedia = useCallback(() => {
    const target = media();
    if (!target) return;
    void target.play().catch(() => {
      setError("La lecture automatique est bloquée. Appuyez sur lecture pour démarrer le média.");
      setLoading(false);
    });
  }, [media]);

  const toggleCurrentMedia = useCallback(() => {
    const target = media();
    if (!target) return;
    if (target.paused) playCurrentMedia();
    else target.pause();
  }, [media, playCurrentMedia]);

  useEffect(() => {
    const target = media();
    if (target) target.playbackRate = playbackRate;
  }, [media, playbackRate]);

  useEffect(() => {
    if (!autoplay || loading) return;
    playCurrentMedia();
  }, [autoplay, loading, mediaKind, playCurrentMedia]);

  useEffect(() => {
    const target = media();
    setMediaSessionPlayback({
      state: playing ? "playing" : loading ? "none" : "paused",
      duration: duration || target?.duration,
      position,
      playbackRate,
    });
  }, [duration, loading, media, playbackRate, playing, position]);

  useEffect(() => {
    const actions: Partial<Record<MediaSessionAction, MediaSessionActionHandler | null>> = {
      play: playCurrentMedia,
      pause: () => media()?.pause(),
      previoustrack: onPrevious ?? null,
      nexttrack: onNext ?? null,
      seekbackward: () => seek((media()?.currentTime ?? 0) - 15),
      seekforward: () => seek((media()?.currentTime ?? 0) + 15),
      seekto: (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime);
      },
    };
    setMediaSessionMetadata({
      title: content.title,
      artist: content.description ?? "RIHLA",
      album: "RIHLA · Contenu parlé",
      artworkUrl: content.artworkUrl,
      actions,
    });
    return () => clearMediaSession(MEDIA_SESSION_ACTIONS);
  }, [content.artworkUrl, content.description, content.title, media, onNext, onPrevious, playCurrentMedia, seek]);

  useEffect(() => {
    if (sleepMinutes === null) {
      sleepDeadlineRef.current = null;
      return;
    }
    sleepDeadlineRef.current = Date.now() + sleepMinutes * 60_000;
    const timer = window.setInterval(() => {
      if (sleepDeadlineRef.current && Date.now() >= sleepDeadlineRef.current) {
        media()?.pause();
        setSleepMinutes(null);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [media, sleepMinutes]);

  const handleLoadedMetadata = (kind: MediaKind, target: HTMLMediaElement) => {
    if (switchTargetRef.current && switchTargetRef.current !== kind) return;
    const switching = switchTargetRef.current === kind;
    const targetPosition = switching && switchPositionRef.current !== null
      ? switchPositionRef.current
      : initialPositionMs / 1000;
    target.currentTime = Math.min(targetPosition, target.duration || targetPosition);
    target.playbackRate = playbackRate;
    setDuration(target.duration || 0);
    setPosition(target.currentTime);
    setLoading(false);
    setError(null);
    if (switching) {
      switchPositionRef.current = null;
      switchTargetRef.current = null;
      if (switchResumeRef.current) {
        switchResumeRef.current = false;
        void target.play().catch(() => setError("Impossible de reprendre ce média automatiquement."));
      }
    }
  };

  const handleTimeUpdate = (target: HTMLMediaElement) => {
    const positionMs = target.currentTime * 1000;
    const durationMs = (target.duration || 0) * 1000;
    setPosition(target.currentTime);
    if (Math.abs(positionMs - lastSavedRef.current) >= 5000) {
      lastSavedRef.current = positionMs;
      onProgress?.(positionMs, durationMs);
    }
  };

  const handleEnded = (target: HTMLMediaElement) => {
    const durationMs = (target.duration || duration) * 1000;
    setPlaying(false);
    setLoading(false);
    setPosition(target.duration || duration);
    onProgress?.(durationMs, durationMs);
    if (sleepAtEnd) {
      setSleepAtEnd(false);
      target.pause();
    } else {
      onEnded?.();
    }
  };

  const switchMedia = (kind: MediaKind) => {
    if (kind === mediaKind) return;
    const current = media();
    switchPositionRef.current = current?.currentTime ?? position;
    switchTargetRef.current = kind;
    switchResumeRef.current = playing;
    current?.pause();
    setError(null);
    setLoading(true);
    setMediaKind(kind);
  };

  const retry = () => {
    const target = media();
    if (!target) return;
    setError(null);
    setLoading(true);
    target.load();
    playCurrentMedia();
  };

  const audioUrl = asset.kind === "AUDIO" ? asset.url : variants.find((item) => item.kind === "AUDIO")?.url;
  const videoUrl = asset.kind === "VIDEO" ? asset.url : variants.find((item) => item.kind === "VIDEO")?.url;
  const audioAvailable = Boolean(audioUrl);
  const videoAvailable = Boolean(videoUrl);
  const busy = loading;

  return (
    <section className={`spoken-player ${compact ? "spoken-player-compact" : "spoken-player-expanded"}`} aria-label="Lecteur de contenu parlé">
      {audioUrl && <audio
        ref={audioRef}
        className="spoken-audio"
        src={audioUrl}
        preload="auto"
        onLoadedMetadata={(event) => handleLoadedMetadata("AUDIO", event.currentTarget)}
        onTimeUpdate={(event) => handleTimeUpdate(event.currentTarget)}
        onPlay={() => { setPlaying(true); setLoading(false); setError(null); }}
        onPause={() => setPlaying(false)}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => { setLoading(false); setError(null); }}
        onError={() => { setLoading(false); setPlaying(false); setError("Ce média est indisponible ou a expiré. Réessayez ou choisissez une autre source."); }}
        onEnded={(event) => handleEnded(event.currentTarget)}
      />}
      {videoUrl && <video
        ref={videoRef}
        className={mediaKind === "VIDEO" && !compact ? "spoken-video active" : "spoken-video"}
        src={videoUrl}
        playsInline
        controls={false}
        onLoadedMetadata={(event) => handleLoadedMetadata("VIDEO", event.currentTarget)}
        onTimeUpdate={(event) => handleTimeUpdate(event.currentTarget)}
        onPlay={() => { setPlaying(true); setLoading(false); setError(null); }}
        onPause={() => setPlaying(false)}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => { setLoading(false); setError(null); }}
        onError={() => { setLoading(false); setPlaying(false); setError("Cette vidéo est indisponible ou a expiré. Réessayez ou choisissez une autre source."); }}
        onEnded={(event) => handleEnded(event.currentTarget)}
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
              <button type="button" className="icon-button" aria-label="Fermer le lecteur" onClick={() => { onProgress?.(position * 1000, duration * 1000); onClose(); }}><X size={18} /></button>
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
          <div className="spoken-sleep"><span><Timer size={15} />Minuterie</span><select value={sleepMinutes ?? ""} onChange={(event) => { setSleepAtEnd(false); setSleepMinutes(event.target.value ? Number(event.target.value) : null); }}><option value="">Désactivée</option><option value={10}>10 min</option><option value={20}>20 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option></select><button type="button" className={sleepAtEnd ? "active" : ""} aria-pressed={sleepAtEnd} onClick={() => { setSleepMinutes(null); setSleepAtEnd(!sleepAtEnd); }}>Fin de l’épisode</button></div>
          {chapters.length > 0 && <MediaChapters chapters={chapters} positionMs={position * 1000} onSeek={(ms) => seek(ms / 1000)} />}
          {transcript && transcriptSegments.length > 0 && <TimedTranscript transcript={transcript} segments={transcriptSegments} positionMs={position * 1000} onSeek={(ms) => seek(ms / 1000)} onReportIssue={onReportIssue} />}
        </>
      )}
    </section>
  );
}
