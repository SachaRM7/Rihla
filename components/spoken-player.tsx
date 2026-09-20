"use client";

import { LoaderCircle, Pause, Play, RotateCcw, Timer, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ContentItem, MediaAsset, MediaChapter, MediaKind, MediaVariant, Transcript, TranscriptSegment } from "@/lib/domain";
import type { PlaybackRate } from "@/lib/preferences";
import { claimPlayback, ownsPlayback, releasePlayback } from "@/lib/playback-ownership";
import { siblingMediaVariants } from "@/lib/media-variants";
import { formatChapterTime } from "@/lib/media-chapters";
import { MediaModeSwitch } from "@/components/media-mode-switch";
import { MediaChapters } from "@/components/media-chapters";
import { TimedTranscript } from "@/components/timed-transcript";

type Props = {
  content: ContentItem; asset: MediaAsset; variants?: MediaVariant[]; playbackRate: PlaybackRate;
  transcript?: Transcript; transcriptSegments?: TranscriptSegment[]; chapters?: MediaChapter[];
  initialPositionMs?: number; onProgress?: (positionMs: number, durationMs: number) => void;
  onEnded?: () => void; onSleepStop?: () => void;
  onReportIssue?: (kind: "TEXT" | "TIMING" | "SOURCE" | "UNAVAILABLE", note?: string) => void;
  onClose: () => void;
};
type Status = "loading" | "paused" | "playing" | "buffering" | "ended" | "error";
const finite = (n: number) => Number.isFinite(n) && n >= 0 ? n : 0;

/** One media element avoids two clocks, overlapping playback and video/audio races. */
export function SpokenPlayer(props: Props) {
  const { content, asset, variants = [], playbackRate, transcript, transcriptSegments = [], chapters = [], initialPositionMs = 0, onClose } = props;
  const mediaRef = useRef<HTMLVideoElement | null>(null);
  const callbacks = useRef(props);
  callbacks.current = props;
  const [kind, setKind] = useState<MediaKind>(asset.kind);
  const siblings = siblingMediaVariants(asset, variants);
  const source = kind === asset.kind ? asset.url : siblings.find(v => v.kind === kind)?.url;
  const [status, setStatus] = useState<Status>("loading");
  const [position, setPosition] = useState(finite(initialPositionMs) / 1000);
  const [duration, setDuration] = useState(finite(asset.durationMs ?? 0) / 1000);
  const [error, setError] = useState<string | null>(null);
  const [sleep, setSleep] = useState<{ deadline: number } | "end" | null>(null);
  const [remaining, setRemaining] = useState(0);
  const sleepRef = useRef(sleep);
  sleepRef.current = sleep;
  const positionRef = useRef(finite(initialPositionMs) / 1000);
  const pendingSeek = useRef<number | null>(positionRef.current);
  const wantsPlay = useRef(true);
  const generation = useRef(0);
  const savedAt = useRef(-Infinity);
  const progressDirty = useRef(false);
  const sourceTransition = useRef(false);
  const [retryVersion, setRetryVersion] = useState(0);

  const save = (force = false) => {
    const media = mediaRef.current;
    if (!media || sourceTransition.current || !progressDirty.current) return;
    if (!force && Date.now() - savedAt.current < 5000) return;
    const at = finite(media.currentTime);
    positionRef.current = at;
    savedAt.current = Date.now();
    callbacks.current.onProgress?.(at * 1000, finite(media.duration) * 1000);
    if (force) progressDirty.current = false;
  };
  const pause = () => {
    wantsPlay.current = false;
    mediaRef.current?.pause();
    save(true);
    setStatus("paused");
  };
  const requestPlay = () => {
    const media = mediaRef.current;
    if (!media || !source) return;
    const version = generation.current;
    wantsPlay.current = true;
    claimPlayback(media, pause);
    setError(null);
    void media.play().catch((reason: unknown) => {
      if (version !== generation.current || !wantsPlay.current) return;
      wantsPlay.current = false;
      setStatus("paused");
      setError(reason instanceof DOMException && reason.name === "NotAllowedError"
        ? "Touchez Lecture pour démarrer dans ce navigateur."
        : "Lecture interrompue. Réessayez sans perdre votre position.");
    });
  };
  const seek = (seconds: number) => {
    const media = mediaRef.current;
    if (!media || !Number.isFinite(seconds)) return;
    const maximum = finite(media.duration);
    const target = Math.max(0, maximum > 0 ? Math.min(seconds, maximum) : seconds);
    positionRef.current = target;
    setPosition(target);
    if (media.readyState < 1) { pendingSeek.current = target; return; }
    try { media.currentTime = target; progressDirty.current = true; save(true); } catch { pendingSeek.current = target; }
  };
  const actions = useRef({ pause, requestPlay, seek, save });
  actions.current = { pause, requestPlay, seek, save };

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !source) return;
    const version = ++generation.current;
    sourceTransition.current = true;
    media.pause();
    pendingSeek.current = positionRef.current;
    setStatus("loading");
    setError(null);
    let ended = false;
    const session = typeof navigator !== "undefined" && "mediaSession" in navigator ? navigator.mediaSession : null;
    const setAction = (name: MediaSessionAction, handler: MediaSessionActionHandler | null) => { try { session?.setActionHandler(name, handler); } catch { /* optional browser action */ } };
    const syncSession = () => {
      if (!session || !ownsPlayback(media)) return;
      session.playbackState = media.paused ? "paused" : "playing";
      if (finite(media.duration) > 0) {
        try { session.setPositionState({ duration: media.duration, position: Math.min(finite(media.currentTime), media.duration), playbackRate: media.playbackRate }); } catch { /* partial browser support */ }
      }
    };
    const metadata = () => {
      if (version !== generation.current) return;
      media.playbackRate = callbacks.current.playbackRate;
      const maximum = finite(media.duration);
      setDuration(maximum);
      if (pendingSeek.current !== null) {
        const target = maximum ? Math.min(pendingSeek.current, maximum) : pendingSeek.current;
        try { media.currentTime = target; pendingSeek.current = null; positionRef.current = target; setPosition(target); } catch { /* wait for seekable data */ }
      }
      sourceTransition.current = false;
      if (media.paused && !wantsPlay.current) setStatus("paused");
      syncSession();
    };
    const playing = () => {
      claimPlayback(media, () => actions.current.pause());
      ended = false;
      setStatus("playing"); setError(null); progressDirty.current = true;
      if (session && typeof MediaMetadata !== "undefined") session.metadata = new MediaMetadata({ title: content.title, album: "RIHLA" });
      setAction("play", () => actions.current.requestPlay());
      setAction("pause", () => actions.current.pause());
      setAction("stop", () => actions.current.pause());
      setAction("seekbackward", d => actions.current.seek(media.currentTime - (d.seekOffset ?? 15)));
      setAction("seekforward", d => actions.current.seek(media.currentTime + (d.seekOffset ?? 15)));
      setAction("seekto", d => { if (d.seekTime !== undefined) actions.current.seek(d.seekTime); });
      syncSession();
    };
    const paused = () => { if (!sourceTransition.current) { setStatus(media.ended ? "ended" : "paused"); actions.current.save(true); syncSession(); } };
    const update = () => {
      if (sourceTransition.current) return;
      positionRef.current = finite(media.currentTime); setPosition(positionRef.current);
      if (!media.paused) progressDirty.current = true;
      actions.current.save(); syncSession();
    };
    const waiting = () => { if (!media.paused) setStatus("buffering"); };
    const canPlay = () => { metadata(); if (media.paused && !wantsPlay.current) setStatus("paused"); };
    const failed = () => {
      sourceTransition.current = false; wantsPlay.current = false;
      setStatus("error"); setError("Média indisponible. Vérifiez votre connexion puis réessayez.");
      actions.current.save(true);
    };
    const completed = () => {
      if (ended || version !== generation.current) return;
      ended = true; wantsPlay.current = false; progressDirty.current = true;
      update(); actions.current.save(true); setStatus("ended");
      const currentSleep = sleepRef.current;
      if (currentSleep === "end" || (currentSleep && currentSleep.deadline <= Date.now())) {
        setSleep(null); callbacks.current.onSleepStop?.();
      } else callbacks.current.onEnded?.();
    };
    const events: Record<string, EventListener> = { loadedmetadata: metadata, durationchange: metadata, playing, pause: paused, timeupdate: update, waiting, stalled: waiting, canplay: canPlay, error: failed, ended: completed };
    for (const [name, handler] of Object.entries(events)) media.addEventListener(name, handler);
    const flush = () => actions.current.save(true);
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    media.src = source;
    media.load();
    if (wantsPlay.current) actions.current.requestPlay();
    return () => {
      actions.current.save(true);
      ++generation.current;
      for (const [name, handler] of Object.entries(events)) media.removeEventListener(name, handler);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      if (ownsPlayback(media)) {
        for (const name of ["play", "pause", "stop", "seekbackward", "seekforward", "seekto"] as MediaSessionAction[]) setAction(name, null);
        if (session) session.playbackState = "none";
        releasePlayback(media);
      }
      media.pause();
      media.removeAttribute("src"); media.load();
    };
  }, [source, content.id, content.title, retryVersion]);

  useEffect(() => { if (mediaRef.current) mediaRef.current.playbackRate = playbackRate; }, [playbackRate]);
  useEffect(() => {
    if (!sleep || sleep === "end") { setRemaining(0); return; }
    const tick = () => {
      setRemaining(Math.max(0, Math.ceil((sleep.deadline - Date.now()) / 1000)));
      if (Date.now() >= sleep.deadline) {
        actions.current.pause(); setSleep(null); callbacks.current.onSleepStop?.();
      }
    };
    tick(); const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [sleep]);

  const switchKind = (next: MediaKind) => {
    if (next === kind) return;
    save(true);
    wantsPlay.current = status === "playing" || status === "buffering";
    positionRef.current = finite(mediaRef.current?.currentTime ?? position);
    sourceTransition.current = true; mediaRef.current?.pause(); setKind(next);
  };
  const busy = status === "loading" || status === "buffering";
  const playing = status === "playing" || status === "buffering";
  return <section className="spoken-player" aria-label="Lecteur de contenu parlé">
    <header><div><p className="eyebrow">{busy ? "Chargement…" : status === "ended" ? "Écoute terminée" : playing ? "En cours" : "En pause"}</p><h2>{content.title}</h2></div><button type="button" className="icon-button" aria-label="Fermer le lecteur" onClick={() => { pause(); onClose(); }}><X size={18} /></button></header>
    <video ref={mediaRef} className={kind === "VIDEO" ? "spoken-video active" : "spoken-video"} playsInline preload="metadata" aria-hidden={kind !== "VIDEO"} />
    <MediaModeSwitch active={kind} audioAvailable={asset.kind === "AUDIO" || siblings.some(v => v.kind === "AUDIO")} videoAvailable={asset.kind === "VIDEO" || siblings.some(v => v.kind === "VIDEO")} onChange={switchKind} />
    <input type="range" min={0} max={duration || 0} step={0.1} value={Math.min(position, duration || 0)} disabled={!duration} onChange={e => seek(Number(e.target.value))} aria-label="Position dans le contenu" aria-valuetext={formatChapterTime(position * 1000)} />
    <div className="player-timeline"><div><span>{formatChapterTime(position * 1000)}</span><span>{formatChapterTime(duration * 1000)}</span></div></div>
    {error && <div className="audio-error" role="alert"><span>{error}</span><button type="button" onClick={() => { wantsPlay.current = true; setRetryVersion(v => v + 1); }}><RotateCcw size={14} />Réessayer</button></div>}
    <div className="spoken-player-controls">
      <button type="button" className="secondary-action" onClick={() => seek(position - 15)} aria-label="Reculer de 15 secondes">−15 s</button>
      <button type="button" className="main-player-button" aria-label={playing || wantsPlay.current ? "Mettre en pause" : "Lire"} onClick={() => playing || wantsPlay.current ? pause() : requestPlay()}>{busy ? <LoaderCircle className="spin" size={24} /> : playing ? <Pause size={24} /> : <Play size={24} />}</button>
      <button type="button" className="secondary-action" onClick={() => seek(position + 15)} aria-label="Avancer de 15 secondes">+15 s</button>
    </div>
    <div className="spoken-sleep"><label><Timer size={15} /> Minuterie <select value={sleep === "end" ? "end" : sleep ? "active" : "off"} onChange={e => { const v = e.target.value; if (v !== "active") setSleep(v === "end" ? "end" : v === "off" ? null : { deadline: Date.now() + Number(v) * 60_000 }); }}>
      <option value="off">Désactivée</option>{sleep && sleep !== "end" && <option value="active">Reste {formatChapterTime(remaining * 1000)}</option>}
      {[10,20,30,45,60].map(m => <option value={m} key={m}>{m} min</option>)}<option value="end">Fin de l’épisode</option>
    </select></label></div>
    {chapters.length > 0 && <MediaChapters chapters={chapters} positionMs={position * 1000} onSeek={ms => seek(ms / 1000)} />}
    {transcript && transcriptSegments.some(s => s.transcriptId === transcript.id) && <TimedTranscript transcript={transcript} segments={transcriptSegments} positionMs={position * 1000} onSeek={ms => seek(ms / 1000)} onReportIssue={props.onReportIssue} />}
  </section>;
}
