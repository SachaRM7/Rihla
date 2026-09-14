"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_RECITER_ID } from "@/lib/quran/constants";
import {
  isPlaybackRate,
  isRepeatMode,
  isThemeId,
  sanitizeStudyLoop,
  type PlaybackRate,
  type RepeatMode,
  type StudyLoopPreference,
  type ThemeId,
} from "@/lib/preferences";

const STORAGE_KEY = "rihla.library.v1";
const MAX_HISTORY_ITEMS = 24;
const MAX_NOTES = 250;
const MAX_NOTE_LENGTH = 2_000;
const PROGRESS_WRITE_INTERVAL_MS = 750;

export type ListeningHistoryItem = {
  surah: number;
  ayah: number;
  positionMs: number;
  durationMs: number;
  reciterId: string;
  updatedAt: number;
};

export type AyahNote = {
  surah: number;
  ayah: number;
  text: string;
  updatedAt: number;
};

export type LocalLibrary = {
  version: 1;
  favoriteSurahs: number[];
  favoriteAyahs: string[];
  lastSurah: number;
  lastAyah: number;
  lastPositionMs: number;
  reciterId: string;
  theme: ThemeId;
  playbackRate: PlaybackRate;
  repeatMode: RepeatMode;
  showTranslation: boolean;
  studyLoop: StudyLoopPreference | null;
  listeningHistory: ListeningHistoryItem[];
  ayahNotes: AyahNote[];
};

const DEFAULT_LIBRARY: LocalLibrary = {
  version: 1,
  favoriteSurahs: [],
  favoriteAyahs: [],
  lastSurah: 1,
  lastAyah: 1,
  lastPositionMs: 0,
  reciterId: DEFAULT_RECITER_ID,
  theme: "olive",
  playbackRate: 1,
  repeatMode: "off",
  showTranslation: true,
  studyLoop: null,
  listeningHistory: [],
  ayahNotes: [],
};

function sanitizeAyahNote(value: unknown): AyahNote | null {
  if (!value || typeof value !== "object") return null;
  const note = value as Partial<AyahNote>;
  if (
    !Number.isInteger(note.surah) ||
    note.surah! < 1 ||
    note.surah! > 114 ||
    !Number.isInteger(note.ayah) ||
    note.ayah! < 1 ||
    typeof note.text !== "string" ||
    !Number.isFinite(note.updatedAt)
  ) {
    return null;
  }

  const text = note.text.trim().slice(0, MAX_NOTE_LENGTH);
  if (!text) return null;
  return {
    surah: note.surah!,
    ayah: note.ayah!,
    text,
    updatedAt: Math.max(0, Math.round(note.updatedAt!)),
  };
}

function sanitizeHistoryItem(value: unknown): ListeningHistoryItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<ListeningHistoryItem>;
  if (
    !Number.isInteger(item.surah) ||
    item.surah! < 1 ||
    item.surah! > 114 ||
    !Number.isInteger(item.ayah) ||
    item.ayah! < 1 ||
    !Number.isFinite(item.positionMs) ||
    !Number.isFinite(item.durationMs) ||
    !Number.isFinite(item.updatedAt)
  ) {
    return null;
  }

  const durationMs = Math.max(0, Math.round(item.durationMs!));
  return {
    surah: item.surah!,
    ayah: item.ayah!,
    positionMs: Math.min(Math.max(0, Math.round(item.positionMs!)), durationMs || 86_400_000),
    durationMs,
    reciterId: typeof item.reciterId === "string" ? item.reciterId : DEFAULT_RECITER_ID,
    updatedAt: Math.max(0, Math.round(item.updatedAt!)),
  };
}

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

  const listeningHistory = Array.isArray(candidate.listeningHistory)
    ? candidate.listeningHistory
        .map(sanitizeHistoryItem)
        .filter((item): item is ListeningHistoryItem => Boolean(item))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .filter((item, index, items) =>
          items.findIndex((candidateItem) =>
            candidateItem.surah === item.surah && candidateItem.ayah === item.ayah,
          ) === index,
        )
        .slice(0, MAX_HISTORY_ITEMS)
    : [];

  const ayahNotes = Array.isArray(candidate.ayahNotes)
    ? candidate.ayahNotes
        .map(sanitizeAyahNote)
        .filter((item): item is AyahNote => Boolean(item))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .filter((item, index, items) =>
          items.findIndex((candidateItem) =>
            candidateItem.surah === item.surah && candidateItem.ayah === item.ayah,
          ) === index,
        )
        .slice(0, MAX_NOTES)
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
    lastPositionMs:
      Number.isFinite(candidate.lastPositionMs) && candidate.lastPositionMs! >= 0
        ? Math.min(Math.round(candidate.lastPositionMs!), 86_400_000)
        : 0,
    reciterId: typeof candidate.reciterId === "string" ? candidate.reciterId : DEFAULT_RECITER_ID,
    theme: isThemeId(candidate.theme) ? candidate.theme : "olive",
    playbackRate: isPlaybackRate(candidate.playbackRate) ? candidate.playbackRate : 1,
    repeatMode: isRepeatMode(candidate.repeatMode) ? candidate.repeatMode : "off",
    showTranslation: typeof candidate.showTranslation === "boolean" ? candidate.showTranslation : true,
    studyLoop: sanitizeStudyLoop(candidate.studyLoop),
    listeningHistory,
    ayahNotes,
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
    setLibrary((current) => {
      const sameItem = current.lastSurah === surah && current.lastAyah === ayah;
      if (sameItem && current.reciterId === reciterId) return current;
      return {
        ...current,
        lastSurah: surah,
        lastAyah: ayah,
        lastPositionMs: sameItem ? current.lastPositionMs : 0,
        reciterId,
      };
    });
  }, []);

  const savePlaybackProgress = useCallback((
    surah: number,
    ayah: number,
    positionMs: number,
    durationMs: number,
    reciterId: string,
    force = false,
  ) => {
    const safePosition = Math.max(0, Math.round(positionMs));
    const safeDuration = Math.max(0, Math.round(durationMs));

    setLibrary((current) => {
      const existing = current.listeningHistory.find(
        (item) => item.surah === surah && item.ayah === ayah,
      );
      const sameCurrentItem = current.lastSurah === surah && current.lastAyah === ayah;
      const lastSavedPosition = sameCurrentItem
        ? current.lastPositionMs
        : existing?.positionMs ?? 0;

      if (
        !force &&
        sameCurrentItem &&
        existing &&
        Math.abs(safePosition - lastSavedPosition) < PROGRESS_WRITE_INTERVAL_MS &&
        Math.abs(safeDuration - existing.durationMs) < PROGRESS_WRITE_INTERVAL_MS
      ) {
        return current;
      }

      const nextItem: ListeningHistoryItem = {
        surah,
        ayah,
        positionMs: safePosition,
        durationMs: safeDuration,
        reciterId,
        updatedAt: Date.now(),
      };

      return {
        ...current,
        lastSurah: surah,
        lastAyah: ayah,
        lastPositionMs: safePosition,
        reciterId,
        listeningHistory: [
          nextItem,
          ...current.listeningHistory.filter(
            (item) => item.surah !== surah || item.ayah !== ayah,
          ),
        ].slice(0, MAX_HISTORY_ITEMS),
      };
    });
  }, []);

  const setTheme = useCallback((theme: ThemeId) => {
    setLibrary((current) => ({ ...current, theme }));
  }, []);

  const setPlaybackRate = useCallback((playbackRate: PlaybackRate) => {
    setLibrary((current) => ({ ...current, playbackRate }));
  }, []);

  const setRepeatMode = useCallback((repeatMode: RepeatMode) => {
    setLibrary((current) => ({ ...current, repeatMode }));
  }, []);

  const setShowTranslation = useCallback((showTranslation: boolean) => {
    setLibrary((current) => ({ ...current, showTranslation }));
  }, []);

  const setStudyLoop = useCallback((studyLoop: StudyLoopPreference | null) => {
    setLibrary((current) => ({ ...current, studyLoop: sanitizeStudyLoop(studyLoop) }));
  }, []);

  const saveAyahNote = useCallback((surah: number, ayah: number, text: string) => {
    const normalizedText = text.trim().slice(0, MAX_NOTE_LENGTH);
    setLibrary((current) => ({
      ...current,
      ayahNotes: normalizedText
        ? [
            { surah, ayah, text: normalizedText, updatedAt: Date.now() },
            ...current.ayahNotes.filter((item) => item.surah !== surah || item.ayah !== ayah),
          ].slice(0, MAX_NOTES)
        : current.ayahNotes.filter((item) => item.surah !== surah || item.ayah !== ayah),
    }));
  }, []);

  return {
    library,
    hydrated,
    toggleFavoriteSurah,
    toggleFavoriteAyah,
    saveResume,
    savePlaybackProgress,
    setTheme,
    setPlaybackRate,
    setRepeatMode,
    setShowTranslation,
    setStudyLoop,
    saveAyahNote,
  };
}
