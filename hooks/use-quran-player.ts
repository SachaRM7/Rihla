"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaybackRate, RepeatMode } from "@/lib/preferences";
import type { SurahDetail } from "@/lib/quran/types";

export type PlaybackStatus = "idle" | "loading" | "ready" | "playing" | "paused" | "error";

type PlayerOptions = {
  detail: SurahDetail | null;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  playbackRate: PlaybackRate;
  repeatMode: RepeatMode;
};

function readableAudioError() {
  return "La récitation n’a pas pu être chargée. Vérifiez votre connexion puis réessayez.";
}

export function useQuranPlayer({
  detail,
  activeIndex,
  onActiveIndexChange,
  playbackRate,
  repeatMode,
}: PlayerOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const detailRef = useRef(detail);
  const indexRef = useRef(activeIndex);
  const changeIndexRef = useRef(onActiveIndexChange);
  const playWhenLoadedRef = useRef(false);
  const repeatModeRef = useRef(repeatMode);
  const repeatIterationRef = useRef(1);
  const playbackRateRef = useRef(playbackRate);

  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadedSourceUrl, setLoadedSourceUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [repeatIteration, setRepeatIteration] = useState(1);

  const resetRepeatProgress = useCallback(() => {
    repeatIterationRef.current = 1;
    setRepeatIteration(1);
  }, []);

  useEffect(() => {
    detailRef.current = detail;
    indexRef.current = activeIndex;
    changeIndexRef.current = onActiveIndexChange;
    repeatModeRef.current = repeatMode;
    playbackRateRef.current = playbackRate;
  }, [activeIndex, detail, onActiveIndexChange, playbackRate, repeatMode]);

  useEffect(() => {
    resetRepeatProgress();
  }, [repeatMode, resetRepeatProgress]);

  const loadAtIndex = useCallback((index: number, autoplay: boolean) => {
    const audio = audioRef.current;
    const currentDetail = detailRef.current;
    const ayah = currentDetail?.ayahs[index];
    if (!audio || !ayah) return;

    playWhenLoadedRef.current = autoplay;
    setError(null);
    setStatus("loading");
    setCurrentTime(0);
    setDuration(0);
    setLoadedSourceUrl("");
    resetRepeatProgress();

    if (audio.src !== ayah.audioUrl) {
      audio.src = ayah.audioUrl;
      audio.load();
    }

    if (autoplay) {
      void audio.play().catch(() => {
        playWhenLoadedRef.current = false;
        setStatus("ready");
      });
    }
  }, [resetRepeatProgress]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;
    let animationFrame: number | null = null;
    let lastClockUpdate = 0;

    const stopClock = () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
    };
    const updateClock = (frameTime: number) => {
      if (audio.paused) {
        animationFrame = null;
        return;
      }
      if (frameTime - lastClockUpdate >= 50) {
        setCurrentTime(audio.currentTime);
        lastClockUpdate = frameTime;
      }
      animationFrame = requestAnimationFrame(updateClock);
    };
    const startClock = () => {
      stopClock();
      lastClockUpdate = 0;
      animationFrame = requestAnimationFrame(updateClock);
    };

    const onLoadedMetadata = () => {
      audio.playbackRate = playbackRateRef.current;
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setLoadedSourceUrl(audio.currentSrc || audio.src);
      setStatus(audio.paused ? "ready" : "playing");
      if (playWhenLoadedRef.current && audio.paused) {
        void audio.play().catch(() => {
          playWhenLoadedRef.current = false;
          setStatus("ready");
        });
      }
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onPlay = () => {
      playWhenLoadedRef.current = true;
      setStatus("playing");
      setError(null);
      startClock();
    };
    const onPause = () => {
      stopClock();
      setCurrentTime(audio.currentTime);
      if (!audio.ended && audio.src) setStatus("paused");
    };
    const onError = () => {
      stopClock();
      playWhenLoadedRef.current = false;
      setStatus("error");
      setError(readableAudioError());
      setLoadedSourceUrl("");
    };
    const onEnded = () => {
      stopClock();
      const repeatMode = repeatModeRef.current;
      const repeatLimit = repeatMode === "continuous"
        ? Number.POSITIVE_INFINITY
        : repeatMode === "off"
          ? 1
          : Number(repeatMode);

      if (repeatMode !== "off" && repeatIterationRef.current < repeatLimit) {
        const nextIteration = repeatIterationRef.current + 1;
        repeatIterationRef.current = nextIteration;
        setRepeatIteration(nextIteration);
        audio.currentTime = 0;
        setCurrentTime(0);
        playWhenLoadedRef.current = true;
        void audio.play().catch(() => setStatus("ready"));
        return;
      }
      resetRepeatProgress();
      const currentDetail = detailRef.current;
      const nextIndex = indexRef.current + 1;
      if (!currentDetail || nextIndex >= currentDetail.ayahs.length) {
        playWhenLoadedRef.current = false;
        setStatus("paused");
        setCurrentTime(0);
        return;
      }

      changeIndexRef.current(nextIndex);
      indexRef.current = nextIndex;
      const nextAyah = currentDetail.ayahs[nextIndex];
      setCurrentTime(0);
      setDuration(0);
      setLoadedSourceUrl("");
      audio.src = nextAyah.audioUrl;
      audio.load();
      playWhenLoadedRef.current = true;
      void audio.play().catch(() => setStatus("ready"));
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    audio.addEventListener("ended", onEnded);

    return () => {
      stopClock();
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, [resetRepeatProgress]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (!detail?.ayahs[activeIndex]) {
      const audio = audioRef.current;
      if (!detail && audio?.src) {
        playWhenLoadedRef.current = false;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        queueMicrotask(() => {
          setCurrentTime(0);
          setDuration(0);
          setLoadedSourceUrl("");
          setStatus("idle");
        });
      }
      return;
    }

    const audio = audioRef.current;
    const ayah = detail.ayahs[activeIndex];
    if (!audio) return;

    if (audio.src !== ayah.audioUrl) {
      loadAtIndex(activeIndex, playWhenLoadedRef.current);
    }
  }, [activeIndex, detail, loadAtIndex]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    const currentDetail = detailRef.current;
    const ayah = currentDetail?.ayahs[indexRef.current];
    if (!audio || !ayah) return;

    setError(null);
    playWhenLoadedRef.current = true;
    if (audio.src !== ayah.audioUrl) {
      loadAtIndex(indexRef.current, true);
      return;
    }

    void audio.play().catch(() => {
      playWhenLoadedRef.current = false;
      setStatus("ready");
    });
  }, [loadAtIndex]);

  const pause = useCallback(() => {
    playWhenLoadedRef.current = false;
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    if (status === "playing") pause();
    else play();
  }, [pause, play, status]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.min(Math.max(seconds, 0), audio.duration);
    setCurrentTime(audio.currentTime);
  }, []);

  const selectAyah = useCallback(
    (index: number, autoplay = true) => {
      const currentDetail = detailRef.current;
      if (!currentDetail || index < 0 || index >= currentDetail.ayahs.length) return;

      if (index === indexRef.current) {
        if (autoplay) play();
        return;
      }

      playWhenLoadedRef.current = autoplay;
      indexRef.current = index;
      changeIndexRef.current(index);
      loadAtIndex(index, autoplay);
    },
    [loadAtIndex, play],
  );

  const previous = useCallback(() => selectAyah(Math.max(0, indexRef.current - 1), true), [selectAyah]);
  const next = useCallback(() => {
    const last = (detailRef.current?.ayahs.length ?? 1) - 1;
    selectAyah(Math.min(last, indexRef.current + 1), true);
  }, [selectAyah]);

  const retry = useCallback(() => loadAtIndex(indexRef.current, true), [loadAtIndex]);

  return {
    status,
    isPlaying: status === "playing",
    currentTime,
    duration,
    loadedSourceUrl,
    error,
    repeatIteration,
    play,
    pause,
    toggle,
    seek,
    selectAyah,
    previous,
    next,
    retry,
    canPrevious: activeIndex > 0,
    canNext: Boolean(detail && activeIndex < detail.ayahs.length - 1),
  };
}
