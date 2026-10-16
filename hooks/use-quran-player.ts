"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { AudioLanguage, PlaybackRate, RepeatMode, StudyLoopPreference } from "@/lib/preferences";
import {
  ayahSegmentUrl,
  firstAudioSegment,
  isSegmentAllowed,
  nextAudioSegment,
  type AudioSegment,
} from "@/lib/quran/audio-tracks";
import type { SurahDetail } from "@/lib/quran/types";
import { clearMediaSession, setMediaSessionMetadata, setMediaSessionPlayback } from "@/lib/media-session";

export type PlaybackStatus = "idle" | "loading" | "ready" | "playing" | "paused" | "buffering" | "error";

type PlayerOptions = {
  detail: SurahDetail | null;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  playbackRate: PlaybackRate;
  audioLanguage?: AudioLanguage;
  repeatMode: RepeatMode;
  studyLoop: StudyLoopPreference | null;
  stopAtEnd?: "ayah" | "surah" | null;
  onStopAtEndConsumed?: () => void;
  onSurahEnded?: () => void;
  stopAfterCurrentAyah?: boolean;
  onAyahEnded?: () => void;
  mediaSessionEnabled?: boolean;
};

function readableAudioError() {
  return "La récitation n’a pas pu être chargée. Vérifiez votre connexion puis réessayez.";
}

export function useQuranPlayer({
  detail,
  activeIndex,
  onActiveIndexChange,
  playbackRate,
  audioLanguage = "ar",
  repeatMode,
  studyLoop,
  stopAtEnd = null,
  onStopAtEndConsumed,
  onSurahEnded,
  stopAfterCurrentAyah = false,
  onAyahEnded,
  mediaSessionEnabled = true,
}: PlayerOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const detailRef = useRef(detail);
  const indexRef = useRef(activeIndex);
  const changeIndexRef = useRef(onActiveIndexChange);
  const playWhenLoadedRef = useRef(false);
  const repeatModeRef = useRef(repeatMode);
  const repeatIterationRef = useRef(1);
  const studyLoopRef = useRef(studyLoop);
  const studyLoopIterationRef = useRef(1);
  const playbackRateRef = useRef(playbackRate);
  const onSurahEndedRef = useRef(onSurahEnded);
  const onAyahEndedRef = useRef(onAyahEnded);
  const stopAfterCurrentAyahRef = useRef(stopAfterCurrentAyah);
  const stopAtEndRef = useRef(stopAtEnd);
  const onStopAtEndConsumedRef = useRef(onStopAtEndConsumed);
  const audioLanguageRef = useRef(audioLanguage);
  const segmentRef = useRef<AudioSegment>(firstAudioSegment(audioLanguage));
  const mediaOwner = useId();

  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadedSourceUrl, setLoadedSourceUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [repeatIteration, setRepeatIteration] = useState(1);
  const [studyLoopIteration, setStudyLoopIteration] = useState(1);
  const [segment, setSegment] = useState<AudioSegment>(() => firstAudioSegment(audioLanguage));
  const pauseTimeoutRef = useRef<number | null>(null);

  const resetRepeatProgress = useCallback(() => {
    repeatIterationRef.current = 1;
    setRepeatIteration(1);
  }, []);

  const resetStudyLoopProgress = useCallback(() => {
    studyLoopIterationRef.current = 1;
    setStudyLoopIteration(1);
  }, []);

  const changeSegment = useCallback((next: AudioSegment) => {
    segmentRef.current = next;
    setSegment(next);
  }, []);

  useEffect(() => {
    detailRef.current = detail;
    indexRef.current = activeIndex;
    changeIndexRef.current = onActiveIndexChange;
    repeatModeRef.current = repeatMode;
    studyLoopRef.current = studyLoop;
    playbackRateRef.current = playbackRate;
    onSurahEndedRef.current = onSurahEnded;
    onAyahEndedRef.current = onAyahEnded;
    stopAfterCurrentAyahRef.current = stopAfterCurrentAyah;
    stopAtEndRef.current = stopAtEnd;
    onStopAtEndConsumedRef.current = onStopAtEndConsumed;
  }, [activeIndex, detail, onActiveIndexChange, onAyahEnded, onSurahEnded, playbackRate, repeatMode, stopAfterCurrentAyah, studyLoop, stopAtEnd, onStopAtEndConsumed]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(resetRepeatProgress);
    return () => window.cancelAnimationFrame(frame);
  }, [repeatMode, resetRepeatProgress]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(resetStudyLoopProgress);
    return () => window.cancelAnimationFrame(frame);
  }, [studyLoop, resetStudyLoopProgress]);

  const loadAtIndex = useCallback((index: number, autoplay: boolean) => {
    const audio = audioRef.current;
    const currentDetail = detailRef.current;
    const ayah = currentDetail?.ayahs[index];
    if (!audio || !ayah) return;

    changeSegment(firstAudioSegment(audioLanguageRef.current));
    const sourceUrl = ayahSegmentUrl(ayah, segmentRef.current);
    playWhenLoadedRef.current = autoplay;
    setError(null);
    setStatus("loading");
    setCurrentTime(0);
    setDuration(0);
    setLoadedSourceUrl("");
    resetRepeatProgress();

    if (audio.src !== sourceUrl) {
      audio.src = sourceUrl;
      audio.load();
    }

    if (autoplay) {
      void audio.play().catch(() => {
        playWhenLoadedRef.current = false;
        setStatus("ready");
      });
    }
  }, [changeSegment, resetRepeatProgress]);

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
    const onWaiting = () => {
      if (!audio.paused) setStatus("buffering");
    };
    const onCanPlay = () => {
      if (!audio.paused) setStatus("playing");
      else if (audio.src) setStatus("ready");
    };
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
      const endedAyah = detailRef.current?.ayahs[indexRef.current];
      const followingSegment = endedAyah
        ? nextAudioSegment(audioLanguageRef.current, segmentRef.current, endedAyah)
        : null;
      if (endedAyah && followingSegment) {
        changeSegment(followingSegment);
        setCurrentTime(0);
        setDuration(0);
        setLoadedSourceUrl("");
        setStatus("loading");
        audio.src = ayahSegmentUrl(endedAyah, followingSegment);
        audio.load();
        playWhenLoadedRef.current = true;
        void audio.play().catch(() => setStatus("ready"));
        return;
      }
      if (stopAtEndRef.current === "ayah" || (stopAtEndRef.current === "surah" && indexRef.current >= (detailRef.current?.ayahs.length ?? 1) - 1)) {
        playWhenLoadedRef.current = false;
        setStatus("paused");
        setCurrentTime(0);
        onStopAtEndConsumedRef.current?.();
        return;
      }
      const currentDetail = detailRef.current;
      const currentIndex = indexRef.current;

      const moveToIndex = (targetIndex: number, autoplay: boolean) => {
        const targetAyah = currentDetail?.ayahs[targetIndex];
        if (!currentDetail || !targetAyah) return false;
        changeIndexRef.current(targetIndex);
        indexRef.current = targetIndex;
        changeSegment(firstAudioSegment(audioLanguageRef.current));
        setCurrentTime(0);
        setDuration(0);
        setLoadedSourceUrl("");
        setStatus("loading");
        audio.src = ayahSegmentUrl(targetAyah, segmentRef.current);
        audio.load();
        playWhenLoadedRef.current = autoplay;
        if (autoplay) void audio.play().catch(() => setStatus("ready"));
        return true;
      };

      const studyLoop = studyLoopRef.current;
      if (studyLoop && currentDetail?.surah.number === studyLoop.surah) {
        const startIndex = currentDetail.ayahs.findIndex(
          (ayah) => ayah.numberInSurah === studyLoop.startAyah,
        );
        const endIndex = currentDetail.ayahs.findIndex(
          (ayah) => ayah.numberInSurah === studyLoop.endAyah,
        );
        const isInsideRange = startIndex >= 0 && endIndex >= startIndex && currentIndex >= startIndex && currentIndex <= endIndex;

        if (isInsideRange) {
          resetRepeatProgress();
          if (currentIndex < endIndex) {
            moveToIndex(currentIndex + 1, true);
            return;
          }

          const cycleLimit = studyLoop.cycles === "continuous"
            ? Number.POSITIVE_INFINITY
            : Number(studyLoop.cycles);
          if (studyLoopIterationRef.current < cycleLimit) {
            const nextIteration = studyLoopIterationRef.current + 1;
            studyLoopIterationRef.current = nextIteration;
            setStudyLoopIteration(nextIteration);
            const pauseMs = Math.max(0, (studyLoop.pauseSeconds ?? 0) * 1000);
            if (pauseMs > 0) {
              playWhenLoadedRef.current = false;
              setStatus("paused");
              pauseTimeoutRef.current = window.setTimeout(() => { pauseTimeoutRef.current = null; moveToIndex(startIndex, true); }, pauseMs);
            } else {
              moveToIndex(startIndex, true);
            }
            return;
          }

          resetStudyLoopProgress();
          moveToIndex(startIndex, false);
          return;
        }
      }

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
        const firstSegment = firstAudioSegment(audioLanguageRef.current);
        if (endedAyah && segmentRef.current !== firstSegment) {
          // En mode arabe puis français, chaque répétition reprend depuis la récitation.
          changeSegment(firstSegment);
          setDuration(0);
          setLoadedSourceUrl("");
          audio.src = ayahSegmentUrl(endedAyah, firstSegment);
          audio.load();
        } else {
          audio.currentTime = 0;
        }
        setCurrentTime(0);
        const repeatPauseMs = Math.max(0, (studyLoopRef.current?.pauseSeconds ?? 0) * 1000);
        if (repeatPauseMs > 0) {
          playWhenLoadedRef.current = false;
          setStatus("paused");
          pauseTimeoutRef.current = window.setTimeout(() => {
            pauseTimeoutRef.current = null;
            playWhenLoadedRef.current = true;
            void audio.play().catch(() => setStatus("ready"));
          }, repeatPauseMs);
        } else {
          playWhenLoadedRef.current = true;
          void audio.play().catch(() => setStatus("ready"));
        }
        return;
      }
      resetRepeatProgress();
      if (stopAfterCurrentAyahRef.current) {
        playWhenLoadedRef.current = false;
        setStatus("paused");
        setCurrentTime(0);
        onAyahEndedRef.current?.();
        return;
      }
      const nextIndex = indexRef.current + 1;
      if (!currentDetail || nextIndex >= currentDetail.ayahs.length) {
        playWhenLoadedRef.current = false;
        setStatus("paused");
        setCurrentTime(0);
        onSurahEndedRef.current?.();
        return;
      }

      moveToIndex(nextIndex, true);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("stalled", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    audio.addEventListener("ended", onEnded);

    return () => {
      stopClock();
      if (pauseTimeoutRef.current !== null) {
        window.clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("stalled", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, [changeSegment, resetRepeatProgress, resetStudyLoopProgress]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    audioLanguageRef.current = audioLanguage;
    if (isSegmentAllowed(audioLanguage, segmentRef.current)) return;
    const audio = audioRef.current;
    if (audio?.src && detailRef.current?.ayahs[indexRef.current]) {
      loadAtIndex(indexRef.current, !audio.paused || playWhenLoadedRef.current);
    } else {
      queueMicrotask(() => changeSegment(firstAudioSegment(audioLanguage)));
    }
  }, [audioLanguage, changeSegment, loadAtIndex]);



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

    if (audio.src !== ayahSegmentUrl(ayah, segmentRef.current)) {
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
    if (audio.src !== ayahSegmentUrl(ayah, segmentRef.current)) {
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
    if (pauseTimeoutRef.current !== null) {
      window.clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!mediaSessionEnabled || !audio) return;
    setMediaSessionPlayback({
      owner: mediaOwner,
      state: status === "playing" ? "playing" : status === "paused" || status === "ready" ? "paused" : "none",
      duration: duration || audio.duration,
      position: currentTime,
      playbackRate: audio.playbackRate || playbackRate,
    });
  }, [currentTime, duration, mediaSessionEnabled, mediaOwner, playbackRate, status]);

  useEffect(() => {
    if (!mediaSessionEnabled || !detail) return;
    const ayah = detail.ayahs[activeIndex];
    if (!ayah) return;
    const seekTo = (details: MediaSessionActionDetails) => {
      const audio = audioRef.current;
      if (!audio || details.seekTime === undefined || !Number.isFinite(audio.duration)) return;
      audio.currentTime = Math.min(Math.max(details.seekTime, 0), audio.duration);
      setCurrentTime(audio.currentTime);
    };
    const actions: Partial<Record<MediaSessionAction, MediaSessionActionHandler | null>> = {
      play,
      pause,
      previoustrack: previous,
      nexttrack: next,
      seekto: seekTo,
    };
    const isFrench = segment === "fr" && Boolean(ayah.frenchAudioUrl);
    setMediaSessionMetadata({
      owner: mediaOwner,
      title: `${detail.surah.englishName} · Ayah ${ayah.numberInSurah}${isFrench ? " · Traduction" : ""}`,
      artist: isFrench ? detail.frenchAudioNarrator ?? detail.reciterName : detail.reciterName,
      album: "RIHLA · Le Coran",
      actions,
    });
    return () => {
      clearMediaSession(Object.keys(actions) as MediaSessionAction[], mediaOwner);
    };
  }, [activeIndex, detail, mediaSessionEnabled, mediaOwner, next, pause, play, previous, segment]);

  return {
    status,
    isPlaying: status === "playing",
    currentTime,
    duration,
    loadedSourceUrl,
    error,
    repeatIteration,
    studyLoopIteration,
    segment,
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
