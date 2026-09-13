"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SurahDetail } from "@/lib/quran/types";

export type PlaybackStatus = "idle" | "loading" | "ready" | "playing" | "paused" | "error";

type PlayerOptions = {
  detail: SurahDetail | null;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
};

function readableAudioError() {
  return "La récitation n’a pas pu être chargée. Vérifiez votre connexion puis réessayez.";
}

export function useQuranPlayer({
  detail,
  activeIndex,
  onActiveIndexChange,
}: PlayerOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const detailRef = useRef(detail);
  const indexRef = useRef(activeIndex);
  const changeIndexRef = useRef(onActiveIndexChange);
  const playWhenLoadedRef = useRef(false);

  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detailRef.current = detail;
    indexRef.current = activeIndex;
    changeIndexRef.current = onActiveIndexChange;
  }, [activeIndex, detail, onActiveIndexChange]);

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
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
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
    };
    const onPause = () => {
      if (!audio.ended && audio.src) setStatus("paused");
    };
    const onError = () => {
      playWhenLoadedRef.current = false;
      setStatus("error");
      setError(readableAudioError());
    };
    const onEnded = () => {
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
  }, []);

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
    error,
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
