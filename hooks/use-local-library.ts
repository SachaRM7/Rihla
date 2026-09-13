"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_RECITER_ID } from "@/lib/quran/constants";
import {
  isPlaybackRate,
  isThemeId,
  type PlaybackRate,
  type ThemeId,
} from "@/lib/preferences";

const STORAGE_KEY = "rihla.library.v1";

export type LocalLibrary = {
  version: 1;
  favoriteSurahs: number[];
  favoriteAyahs: string[];
  lastSurah: number;
  lastAyah: number;
  reciterId: string;
  theme: ThemeId;
  playbackRate: PlaybackRate;
};

const DEFAULT_LIBRARY: LocalLibrary = {
  version: 1,
  favoriteSurahs: [],
  favoriteAyahs: [],
  lastSurah: 1,
  lastAyah: 1,
  reciterId: DEFAULT_RECITER_ID,
  theme: "olive",
  playbackRate: 1,
};

function sanitizeLibrary(value: unknown): LocalLibrary {
  if (!value || typeof value !== "object") return DEFAULT_LIBRARY;
  const candidate = value as Partial<LocalLibrary>;
  if (candidate.version !== 1) return DEFAULT_LIBRARY;

  const favoriteSurahs = Array.isArray(candidate.favoriteSurahs)
    ? [...new Set(candidate.favoriteSurahs.filter((item) => Number.isInteger(item) && item >= 1 && item <= 114))]
    : [];

  const favoriteAyahs = Array.isArray(candidate.favoriteAyahs)
    ? [...new Set(candidate.favoriteAyahs.filter((item): item is string => typeof item === "string" && /^\d{1,3}:\d{1,3}$/.test(item)))]
    : [];

  return {
    version: 1,
    favoriteSurahs,
    favoriteAyahs,
    lastSurah:
      Number.isInteger(candidate.lastSurah) && candidate.lastSurah! >= 1 && candidate.lastSurah! <= 114
        ? candidate.lastSurah!
        : 1,
    lastAyah: Number.isInteger(candidate.lastAyah) && candidate.lastAyah! >= 1 ? candidate.lastAyah! : 1,
    reciterId: typeof candidate.reciterId === "string" ? candidate.reciterId : DEFAULT_RECITER_ID,
    theme: isThemeId(candidate.theme) ? candidate.theme : "olive",
    playbackRate: isPlaybackRate(candidate.playbackRate) ? candidate.playbackRate : 1,
  };
}

export function useLocalLibrary() {
  const [library, setLibrary] = useState<LocalLibrary>(DEFAULT_LIBRARY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let restored = DEFAULT_LIBRARY;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) restored = sanitizeLibrary(JSON.parse(stored));
    } catch {
      // The player remains usable when storage is blocked or corrupted.
    }

    queueMicrotask(() => {
      setLibrary(restored);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    } catch {
      // Storage is an enhancement, never a playback dependency.
    }
  }, [hydrated, library]);

  const toggleFavoriteSurah = useCallback((number: number) => {
    setLibrary((current) => ({
      ...current,
      favoriteSurahs: current.favoriteSurahs.includes(number)
        ? current.favoriteSurahs.filter((item) => item !== number)
        : [...current.favoriteSurahs, number],
    }));
  }, []);

  const toggleFavoriteAyah = useCallback((surah: number, ayah: number) => {
    const key = `${surah}:${ayah}`;
    setLibrary((current) => ({
      ...current,
      favoriteAyahs: current.favoriteAyahs.includes(key)
        ? current.favoriteAyahs.filter((item) => item !== key)
        : [...current.favoriteAyahs, key],
    }));
  }, []);

  const saveResume = useCallback((surah: number, ayah: number, reciterId: string) => {
    setLibrary((current) => ({
      ...current,
      lastSurah: surah,
      lastAyah: ayah,
      reciterId,
    }));
  }, []);

  const setTheme = useCallback((theme: ThemeId) => {
    setLibrary((current) => ({ ...current, theme }));
  }, []);

  const setPlaybackRate = useCallback((playbackRate: PlaybackRate) => {
    setLibrary((current) => ({ ...current, playbackRate }));
  }, []);

  return {
    library,
    hydrated,
    toggleFavoriteSurah,
    toggleFavoriteAyah,
    saveResume,
    setTheme,
    setPlaybackRate,
  };
}
