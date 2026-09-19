"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_RECITER_ID } from "@/lib/quran/constants";
import {
  isAppearanceMode,
  isAudioQuality,
  isPlaybackRate,
  isReadingSize,
  isRepeatMode,
  isThemeId,
  isTranslationSize,
  sanitizeStudyLoop,
  type AppearanceMode,
  type AudioQuality,
  type PlaybackRate,
  type ReadingSize,
  type RepeatMode,
  type StudyLoopPreference,
  type ThemeId,
  type TranslationSize,
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

export type PersonalPlaylist = {
  id: string;
  title: string;
  ayahKeys: string[];
  createdAt: number;
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
  appearance: AppearanceMode;
  readingSize: ReadingSize;
  translationSize: TranslationSize;
  autoScroll: boolean;
  playbackRate: PlaybackRate;
  repeatMode: RepeatMode;
  showTranslation: boolean;
  studyLoop: StudyLoopPreference | null;
  listeningHistory: ListeningHistoryItem[];
  ayahNotes: AyahNote[];
  historyEnabled: boolean;
  playlists: PersonalPlaylist[];
  quranReadingSurah: number;
  quranReadingAyah: number;
  quranReadingUpdatedAt: number;
  wifiOnlyDownloads: boolean;
  audioQuality: AudioQuality;
  memorizationMode: boolean;
  hiddenRecommendations: string[];
  remindersEnabled: boolean;
  reminderTime: string;
  memorizationRevealDelay: number;
  readingGoalEnabled: boolean;
  readingGoalAyahsPerDay: number;
  readingDays: Record<string, string[]>;
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
  appearance: "system",
  readingSize: "comfortable",
  translationSize: "comfortable",
  autoScroll: true,
  playbackRate: 1,
  repeatMode: "off",
  showTranslation: true,
  studyLoop: null,
  listeningHistory: [],
  ayahNotes: [],
  historyEnabled: true,
  playlists: [],
  quranReadingSurah: 1,
  quranReadingAyah: 1,
  quranReadingUpdatedAt: 0,
  wifiOnlyDownloads: true,
  audioQuality: "standard",
  memorizationMode: false,
  hiddenRecommendations: [],
  remindersEnabled: false,
  reminderTime: "19:00",
  memorizationRevealDelay: 0,
  readingGoalEnabled: false,
  readingGoalAyahsPerDay: 10,
  readingDays: {},
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
    appearance: isAppearanceMode(candidate.appearance) ? candidate.appearance : "system",
    readingSize: isReadingSize(candidate.readingSize) ? candidate.readingSize : "comfortable",
    translationSize: isTranslationSize(candidate.translationSize) ? candidate.translationSize : "comfortable",
    autoScroll: typeof candidate.autoScroll === "boolean" ? candidate.autoScroll : true,
    playbackRate: isPlaybackRate(candidate.playbackRate) ? candidate.playbackRate : 1,
    repeatMode: isRepeatMode(candidate.repeatMode) ? candidate.repeatMode : "off",
    showTranslation: typeof candidate.showTranslation === "boolean" ? candidate.showTranslation : true,
    studyLoop: sanitizeStudyLoop(candidate.studyLoop),
    listeningHistory,
    ayahNotes,
    historyEnabled: typeof candidate.historyEnabled === "boolean" ? candidate.historyEnabled : true,
    playlists: Array.isArray(candidate.playlists) ? candidate.playlists.filter((item): item is PersonalPlaylist => Boolean(item && typeof item === "object" && typeof (item as PersonalPlaylist).id === "string" && typeof (item as PersonalPlaylist).title === "string" && Array.isArray((item as PersonalPlaylist).ayahKeys))).slice(0, 100) : [],
    quranReadingSurah: Number.isInteger(candidate.quranReadingSurah) && candidate.quranReadingSurah! >= 1 && candidate.quranReadingSurah! <= 114 ? candidate.quranReadingSurah! : 1,
    quranReadingAyah: Number.isInteger(candidate.quranReadingAyah) && candidate.quranReadingAyah! >= 1 ? candidate.quranReadingAyah! : 1,
    quranReadingUpdatedAt: Number.isFinite(candidate.quranReadingUpdatedAt) ? Math.max(0, Number(candidate.quranReadingUpdatedAt)) : 0,
    wifiOnlyDownloads: typeof candidate.wifiOnlyDownloads === "boolean" ? candidate.wifiOnlyDownloads : true,
    audioQuality: isAudioQuality(candidate.audioQuality) ? candidate.audioQuality : "standard",
    memorizationMode: typeof candidate.memorizationMode === "boolean" ? candidate.memorizationMode : false,
    hiddenRecommendations: Array.isArray(candidate.hiddenRecommendations) ? candidate.hiddenRecommendations.filter((item): item is string => typeof item === "string").slice(0, 100) : [],
    remindersEnabled: typeof candidate.remindersEnabled === "boolean" ? candidate.remindersEnabled : false,
    reminderTime: typeof candidate.reminderTime === "string" && /^([01]\\d|2[0-3]):[0-5]\\d$/.test(candidate.reminderTime) ? candidate.reminderTime : "19:00",
    memorizationRevealDelay: [0, 3, 5, 10].includes(Number(candidate.memorizationRevealDelay)) ? Number(candidate.memorizationRevealDelay) : 0,
    readingGoalEnabled: typeof candidate.readingGoalEnabled === "boolean" ? candidate.readingGoalEnabled : false,
    readingGoalAyahsPerDay: Number.isInteger(candidate.readingGoalAyahsPerDay) ? Math.min(100, Math.max(1, Number(candidate.readingGoalAyahsPerDay))) : 10,
    readingDays: {},
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

  const saveReadingProgress = useCallback((surah: number, ayah: number) => {
    setLibrary((current) => {
      const day = new Date().toISOString().slice(0, 10);
      const key = String(surah) + ":" + String(ayah);
      const today = current.readingDays[day] ?? [];
      return {
        ...current,
        quranReadingSurah: surah,
        quranReadingAyah: ayah,
        quranReadingUpdatedAt: Date.now(),
        readingDays: { ...current.readingDays, [day]: today.includes(key) ? today : [...today, key] },
      };
    });
  }, []);

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

  const setReadingGoal = useCallback((enabled: boolean, ayahsPerDay?: number) => {
    setLibrary((current) => ({ ...current, readingGoalEnabled: enabled, readingGoalAyahsPerDay: ayahsPerDay ?? current.readingGoalAyahsPerDay }));
  }, []);

  const setMemorizationRevealDelay = useCallback((memorizationRevealDelay: number) => setLibrary((current) => ({ ...current, memorizationRevealDelay })), []);

  const setReminderPreferences = useCallback((enabled: boolean, time?: string) => {
    setLibrary((current) => ({ ...current, remindersEnabled: enabled, reminderTime: time ?? current.reminderTime }));
  }, []);

  const restoreRecommendations = useCallback(() => {
    setLibrary((current) => ({ ...current, hiddenRecommendations: [] }));
  }, []);

  const hideRecommendation = useCallback((id: string) => {
    setLibrary((current) => ({ ...current, hiddenRecommendations: [...new Set([...current.hiddenRecommendations, id])] }));
  }, []);

  const setMemorizationMode = useCallback((memorizationMode: boolean) => setLibrary((current) => ({ ...current, memorizationMode })), []);

  const setWifiOnlyDownloads = useCallback((wifiOnlyDownloads: boolean) => setLibrary((current) => ({ ...current, wifiOnlyDownloads })), []);
  const setAudioQuality = useCallback((audioQuality: AudioQuality) => setLibrary((current) => ({ ...current, audioQuality })), []);

  const setHistoryEnabled = useCallback((historyEnabled: boolean) => {
    setLibrary((current) => ({ ...current, historyEnabled }));
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
      if (!current.historyEnabled) {
        return {
          ...current,
          lastSurah: surah,
          lastAyah: ayah,
          lastPositionMs: safePosition,
          reciterId,
        };
      }
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

  const setAppearance = useCallback((appearance: AppearanceMode) => {
    setLibrary((current) => ({ ...current, appearance }));
  }, []);

  const setTheme = useCallback((theme: ThemeId) => {
    setLibrary((current) => ({ ...current, theme }));
  }, []);

  const setTranslationSize = useCallback((translationSize: TranslationSize) => {
    setLibrary((current) => ({ ...current, translationSize }));
  }, []);

  const setReadingSize = useCallback((readingSize: ReadingSize) => {
    setLibrary((current) => ({ ...current, readingSize }));
  }, []);

  const setAutoScroll = useCallback((autoScroll: boolean) => {
    setLibrary((current) => ({ ...current, autoScroll }));
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

  const createPlaylist = useCallback((title: string) => {
    const normalized = title.trim().slice(0, 80);
    if (!normalized) return;
    const now = Date.now();
    setLibrary((current) => ({
      ...current,
      playlists: [{ id: crypto.randomUUID(), title: normalized, ayahKeys: [], createdAt: now, updatedAt: now }, ...current.playlists],
    }));
  }, []);

  const toggleAyahInPlaylist = useCallback((playlistId: string, surah: number, ayah: number) => {
    const key = `${surah}:${ayah}`;
    setLibrary((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) => playlist.id !== playlistId ? playlist : {
        ...playlist,
        ayahKeys: playlist.ayahKeys.includes(key) ? playlist.ayahKeys.filter((item) => item !== key) : [...playlist.ayahKeys, key],
        updatedAt: Date.now(),
      }),
    }));
  }, []);

  const importData = useCallback((raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      const restored = sanitizeLibrary(parsed);
      setLibrary(restored);
      return true;
    } catch {
      return false;
    }
  }, []);

  const removeAyahFromPlaylist = useCallback((playlistId: string, key: string) => {
    setLibrary((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) => playlist.id === playlistId ? {
        ...playlist,
        ayahKeys: playlist.ayahKeys.filter((item) => item !== key),
        updatedAt: Date.now(),
      } : playlist),
    }));
  }, []);

  const renamePlaylist = useCallback((playlistId: string, title: string) => {
    const normalized = title.trim().slice(0, 80);
    if (!normalized) return;
    setLibrary((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) => playlist.id === playlistId ? { ...playlist, title: normalized, updatedAt: Date.now() } : playlist),
    }));
  }, []);

  const renamePlaylist = useCallback((playlistId: string, title: string) => {
    const normalized = title.trim().slice(0, 80);
    if (!normalized) return;
    setLibrary((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) => playlist.id === playlistId ? { ...playlist, title: normalized, updatedAt: Date.now() } : playlist),
    }));
  }, []);

  const movePlaylistAyah = useCallback((playlistId: string, fromIndex: number, toIndex: number) => {
    setLibrary((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) => {
        if (playlist.id !== playlistId || fromIndex < 0 || toIndex < 0 || fromIndex >= playlist.ayahKeys.length || toIndex >= playlist.ayahKeys.length) return playlist;
        const ayahKeys = [...playlist.ayahKeys];
        const [item] = ayahKeys.splice(fromIndex, 1);
        ayahKeys.splice(toIndex, 0, item);
        return { ...playlist, ayahKeys, updatedAt: Date.now() };
      }),
    }));
  }, []);

  const movePlaylistAyah = useCallback((playlistId: string, fromIndex: number, toIndex: number) => {
    setLibrary((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) => {
        if (playlist.id !== playlistId || fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= playlist.ayahKeys.length || toIndex >= playlist.ayahKeys.length) return playlist;
        const ayahKeys = [...playlist.ayahKeys];
        const [moved] = ayahKeys.splice(fromIndex, 1);
        ayahKeys.splice(toIndex, 0, moved);
        return { ...playlist, ayahKeys, updatedAt: Date.now() };
      }),
    }));
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setLibrary((current) => ({ ...current, playlists: current.playlists.filter((playlist) => playlist.id !== playlistId) }));
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
    saveReadingProgress,
    toggleFavoriteAyah,
    saveResume,
    savePlaybackProgress,
    setTheme,
    setAppearance,
    setReadingSize,
    setTranslationSize,
    setAutoScroll,
    setPlaybackRate,
    setRepeatMode,
    setShowTranslation,
    setStudyLoop,
    saveAyahNote,
    createPlaylist,
    toggleAyahInPlaylist,
    deletePlaylist,
    movePlaylistAyah,
    renamePlaylist,
    removeAyahFromPlaylist,
    renamePlaylist,
    movePlaylistAyah,
    exportData: () => JSON.stringify(library, null, 2),
    importData,
    setHistoryEnabled,
    setWifiOnlyDownloads,
    setMemorizationMode,
    hideRecommendation,
    restoreRecommendations,
    setReminderPreferences,
    setMemorizationRevealDelay,
    setReadingGoal,
    setAudioQuality,
    clearHistory: () => setLibrary((current) => ({ ...current, listeningHistory: [], lastPositionMs: 0 })),
    clearPersonalData: () => setLibrary((current) => ({
      ...DEFAULT_LIBRARY,
      theme: current.theme,
      appearance: current.appearance,
      readingSize: current.readingSize,
      translationSize: current.translationSize,
    })),
  };
}
