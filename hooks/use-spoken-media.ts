"use client";

import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";

type Options = {
  url?: string;
  kind: "AUDIO" | "VIDEO";
  initialPositionMs: number;
  durationMs?: number;
  playbackRate: number;
  autoplay: boolean;
  onProgress?: (positionMs: number, durationMs: number) => void;
  onEnded?: () => void;
};

export function useSpokenMedia({ url, kind, initialPositionMs, durationMs, playbackRate, autoplay, onProgress, onEnded }: Options) {
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const callbacks = useRef({ onProgress, onEnded, playbackRate });
  const pendingPosition = useRef(initialPositionMs / 1000);
  const pendingPlay = useRef(autoplay);
  const lastSaved = useRef(initialPositionMs);
  const [attempt, setAttempt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState(initialPositionMs / 1000);
  const [duration, setDuration] = useState((durationMs ?? 0) / 1000);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { callbacks.current = { onProgress, onEnded, playbackRate }; }, [onProgress, onEnded, playbackRate]);
  const setMediaRef = useCallback((node: HTMLMediaElement | null) => { mediaRef.current = node; }, []);
  const save = useCallback((target = mediaRef.current) => {
    if (!target || target.readyState === 0 || !Number.isFinite(target.currentTime)) return;
    callbacks.current.onProgress?.(target.currentTime * 1000, Number.isFinite(target.duration) ? target.duration * 1000 : 0);
  }, []);
  const play = useCallback(() => {
    const target = mediaRef.current;
    if (!target) return;
    pendingPlay.current = false;
    void target.play().catch((cause: unknown) => {
      if (target !== mediaRef.current || (cause instanceof DOMException && cause.name === "AbortError")) return;
      setError(cause instanceof DOMException && cause.name === "NotAllowedError"
        ? "La lecture automatique est bloquée. Appuyez sur lecture."
        : "Lecture impossible. Vérifiez la connexion ou téléchargez à nouveau le fichier.");
      setLoading(false);
    });
  }, []);
  const pause = useCallback(() => { pendingPlay.current = false; mediaRef.current?.pause(); save(); }, [save]);
  const toggle = useCallback(() => { if (mediaRef.current?.paused) play(); else pause(); }, [pause, play]);
  const seek = useCallback((seconds: number) => {
    const target = mediaRef.current;
    if (!target || !Number.isFinite(seconds)) return;
    const end = Number.isFinite(target.duration) ? target.duration : Math.max(0, seconds);
    pendingPosition.current = Math.max(0, Math.min(seconds, end));
    target.currentTime = pendingPosition.current;
    setPosition(target.currentTime);
    save(target);
  }, [save]);

  useEffect(() => {
    const target = mediaRef.current;
    if (!target) return;
    let cancelled = false;
    let objectUrl: string | undefined;
    const resolve = async () => {
      setLoading(true);
      setError(null);
      if (!url) throw new Error("Aucun média disponible pour ce format.");
      let source = url;
      if (!navigator.onLine) {
        const response = "caches" in window ? await (await caches.open("rihla-offline-media-v1")).match(url) : undefined;
        if (!response) throw new Error("Ce fichier n’est pas disponible hors connexion sur cet appareil.");
        const blob = await response.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        source = objectUrl;
      }
      if (cancelled) return;
      target.src = source;
      target.playbackRate = callbacks.current.playbackRate;
      target.load();
    };
    // Resolving Cache Storage is async; cancelled source resolutions must not attach to the next track.
    void Promise.resolve().then(resolve).catch((cause: unknown) => {
      if (!cancelled) { setError(cause instanceof Error ? cause.message : "Média indisponible."); setLoading(false); }
    });
    return () => {
      cancelled = true;
      if (target.readyState > 0) pendingPosition.current = target.currentTime;
      if (!target.paused) pendingPlay.current = true;
      save(target);
      target.pause();
      target.removeAttribute("src");
      target.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attempt, kind, save, url]);

  useEffect(() => {
    if (mediaRef.current) mediaRef.current.playbackRate = playbackRate;
  }, [playbackRate]);
  useEffect(() => {
    const target = mediaRef.current;
    if (!autoplay) return;
    if (target && target.readyState > 0) play();
    else pendingPlay.current = true;
  }, [autoplay, play]);
  useEffect(() => {
    const persist = () => save();
    window.addEventListener("pagehide", persist);
    const onVisibility = () => { if (document.visibilityState === "hidden") save(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("pagehide", persist); document.removeEventListener("visibilitychange", onVisibility); };
  }, [save]);

  const retry = useCallback(() => { pendingPlay.current = true; setAttempt((value) => value + 1); }, []);
  const prepareSwitch = useCallback(() => {
    const target = mediaRef.current;
    if (!target) return;
    pendingPosition.current = target.currentTime;
    pendingPlay.current = !target.paused;
    save(target);
  }, [save]);
  const handlers = {
    onLoadedMetadata: (event: SyntheticEvent<HTMLMediaElement>) => {
      const target = event.currentTarget;
      if (target !== mediaRef.current) return;
      const length = Number.isFinite(target.duration) ? target.duration : 0;
      target.currentTime = Math.max(0, Math.min(pendingPosition.current, length || pendingPosition.current));
      target.playbackRate = callbacks.current.playbackRate;
      setPosition(target.currentTime);
      setDuration(length);
      setLoading(false);
      if (pendingPlay.current) play();
    },
    onTimeUpdate: (event: SyntheticEvent<HTMLMediaElement>) => {
      const target = event.currentTarget;
      setPosition(target.currentTime);
      if (Math.abs(target.currentTime * 1000 - lastSaved.current) >= 5000) { lastSaved.current = target.currentTime * 1000; save(target); }
    },
    onPlay: () => { setPlaying(true); setLoading(false); setError(null); },
    onPause: (event: SyntheticEvent<HTMLMediaElement>) => { setPlaying(false); save(event.currentTarget); },
    onWaiting: () => { if (!mediaRef.current?.paused) setLoading(true); },
    onCanPlay: () => setLoading(false),
    onError: () => { setLoading(false); setPlaying(false); setError("Ce média est indisponible ou a expiré. Réessayez ou choisissez un autre contenu."); },
    onEnded: (event: SyntheticEvent<HTMLMediaElement>) => { setPlaying(false); save(event.currentTarget); callbacks.current.onEnded?.(); },
  };
  return { mediaRef, setMediaRef, handlers, position, duration, playing, loading, error, play, pause, toggle, seek, retry, save, prepareSwitch };
}
