"use client";

import type { QueueEntry } from "@/lib/playback";
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
  spokenContentIds: string[];
  itemOrder: string[];
  allowMixedContent: boolean;
  createdAt: number;
  updatedAt: number;
};

export type SpokenProgress = { contentId: string; positionMs: number; durationMs: number; updatedAt: number };

export type FollowedTarget = { id: string; type: "CREATOR" | "SERIES"; notify: boolean };

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
  continuousQuran: boolean;
  hiddenRecommendations: string[];
  remindersEnabled: boolean;
  reminderTime: string;
  memorizationRevealDelay: number;
  readingGoalEnabled: boolean;
  readingGoalAyahsPerDay: number;
  readingDays: Record<string, string[]>;
  readingGoalMode: "AYAT" | "KHATMA";
  khatmaTargetDays: number;
  follows: FollowedTarget[];
  spokenPlaybackRate: PlaybackRate;
  spokenProgress: SpokenProgress[];
  allowCrossFamilyAutoAdvance: boolean;
  playbackQueue: QueueEntry[];
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
  continuousQuran: false,
  hiddenRecommendations: [],
  remindersEnabled: false,
  reminderTime: "19:00",
  memorizationRevealDelay: 0,
  readingGoalEnabled: false,
  readingGoalAyahsPerDay: 10,
  readingDays: {},
  readingGoalMode: "AYAT",
  khatmaTargetDays: 365,
  follows: [],
  spokenPlaybackRate: 1,
  spokenProgress: [],
  allowCrossFamilyAutoAdvance: false,
  playbackQueue: [],
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

function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
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
    playlists: Array.isArray(candidate.playlists) ? candidate.playlists.filter((item) => Boolean(item && typeof item === "object" && typeof (item as PersonalPlaylist).id === "string" && typeof (item as PersonalPlaylist).title === "string" && Array.isArray((item as PersonalPlaylist).ayahKeys))).slice(0, 100).map((item) => ({ ...(item as PersonalPlaylist), spokenContentIds: Array.isArray((item as PersonalPlaylist).spokenContentIds) ? (item as PersonalPlaylist).spokenContentIds.filter((id): id is string => typeof id === "string") : [], itemOrder: Array.isArray((item as PersonalPlaylist).itemOrder) ? (item as PersonalPlaylist).itemOrder.filter((id): id is string => typeof id === "string") : [...(item as PersonalPlaylist).ayahKeys.map((key) => `quran:${key}`), ...(Array.isArray((item as PersonalPlaylist).spokenContentIds) ? (item as PersonalPlaylist).spokenContentIds.map((id) => `spoken:${id}`) : [])], allowMixedContent: (item as PersonalPlaylist).allowMixedContent === true })) : [],
    quranReadingSurah: Number.isInteger(candidate.quranReadingSurah) && candidate.quranReadingSurah! >= 1 && candidate.quranReadingSurah! <= 114 ? candidate.quranReadingSurah! : 1,
    quranReadingAyah: Number.isInteger(candidate.quranReadingAyah) && candidate.quranReadingAyah! >= 1 ? candidate.quranReadingAyah! : 1,
    quranReadingUpdatedAt: Number.isFinite(candidate.quranReadingUpdatedAt) ? Math.max(0, Number(candidate.quranReadingUpdatedAt)) : 0,
    wifiOnlyDownloads: typeof candidate.wifiOnlyDownloads === "boolean" ? candidate.wifiOnlyDownloads : true,
    audioQuality: isAudioQuality(candidate.audioQuality) ? candidate.audioQuality : "standard",
    memorizationMode: typeof candidate.memorizationMode === "boolean" ? candidate.memorizationMode : false,
    continuousQuran: typeof candidate.continuousQuran === "boolean" ? candidate.continuousQuran : false,
    hiddenRecommendations: Array.isArray(candidate.hiddenRecommendations) ? candidate.hiddenRecommendations.filter((item): item is string => typeof item === "string").slice(0, 100) : [],
    remindersEnabled: typeof candidate.remindersEnabled === "boolean" ? candidate.remindersEnabled : false,
    reminderTime: typeof candidate.reminderTime === "string" && /^([01]\\d|2[0-3]):[0-5]\\d$/.test(candidate.reminderTime) ? candidate.reminderTime : "19:00",
    memorizationRevealDelay: [0, 3, 5, 10].includes(Number(candidate.memorizationRevealDelay)) ? Number(candidate.memorizationRevealDelay) : 0,
    readingGoalEnabled: typeof candidate.readingGoalEnabled === "boolean" ? candidate.readingGoalEnabled : false,
    readingGoalAyahsPerDay: Number.isInteger(candidate.readingGoalAyahsPerDay) ? Math.min(100, Math.max(1, Number(candidate.readingGoalAyahsPerDay))) : 10,
    readingGoalMode: candidate.readingGoalMode === "KHATMA" ? "KHATMA" : "AYAT",
    khatmaTargetDays: Number.isInteger(candidate.khatmaTargetDays) ? Math.min(730, Math.max(30, Number(candidate.khatmaTargetDays))) : 365,
    readingDays: candidate.readingDays && typeof candidate.readingDays === "object"
      ? Object.fromEntries(
          Object.entries(candidate.readingDays as Record<string, unknown>)
            .filter(([day, entries]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Array.isArray(entries))
            .slice(-120)
            .map(([day, entries]) => [
              day,
              [...new Set((entries as unknown[]).filter((item): item is string => typeof item === "string" && /^\d{1,3}:\d{1,3}$/.test(item)))].slice(0, 200),
            ]),
        )
      : {},
    follows: Array.isArray(candidate.follows) ? candidate.follows.filter((item): item is FollowedTarget => Boolean(item && typeof item === "object" && typeof (item as FollowedTarget).id === "string" && ((item as FollowedTarget).type === "CREATOR" || (item as FollowedTarget).type === "SERIES"))).slice(0, 200) : [],
    spokenPlaybackRate: isPlaybackRate(candidate.spokenPlaybackRate) ? candidate.spokenPlaybackRate : 1,
    spokenProgress: Array.isArray(candidate.spokenProgress) ? candidate.spokenProgress.filter((item): item is SpokenProgress => Boolean(item && typeof item === "object" && typeof (item as SpokenProgress).contentId === "string" && Number.isFinite((item as SpokenProgress).positionMs))).slice(0, 100) : [],
    allowCrossFamilyAutoAdvance: typeof candidate.allowCrossFamilyAutoAdvance === "boolean" ? candidate.allowCrossFamilyAutoAdvance : false,
    playbackQueue: Array.isArray(candidate.playbackQueue) ? candidate.playbackQueue.filter((entry): entry is QueueEntry => Boolean(entry && typeof entry === "object" && typeof (entry as QueueEntry).id === "string" && (entry as QueueEntry).item && typeof (entry as QueueEntry).item.title === "string")).slice(0, 100) : [],
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
      const day = localDayKey();
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

  const toggleFollow = useCallback((id: string, type: "CREATOR" | "SERIES") => {
    setLibrary((current) => {
      const exists = current.follows.some((item) => item.id === id && item.type === type);
      return { ...current, follows: exists ? current.follows.filter((item) => !(item.id === id && item.type === type)) : [...current.follows, { id, type, notify: false }] };
    });
  }, []);

  const setFollowNotification = useCallback((id: string, type: "CREATOR" | "SERIES", notify: boolean) => {
    setLibrary((current) => ({ ...current, follows: current.follows.map((item) => item.id === id && item.type === type ? { ...item, notify } : item) }));
  }, []);

  const removeSpokenProgress = useCallback((contentId: string) => setLibrary((current) => ({ ...current, spokenProgress: current.spokenProgress.filter((item) => item.contentId !== contentId) })), []);
  const clearSpokenProgress = useCallback(() => setLibrary((current) => ({ ...current, spokenProgress: [] })), []);

  const saveSpokenProgress = useCallback((contentId: string, positionMs: number, durationMs: number) => {
    setLibrary((current) => {
      if (!current.historyEnabled) return current;
      return { ...current, spokenProgress: [{ contentId, positionMs: Math.max(0, Math.round(positionMs)), durationMs: Math.max(0, Math.round(durationMs)), updatedAt: Date.now() }, ...current.spokenProgress.filter((item) => item.contentId !== contentId)].slice(0, 100) };
    });
  }, []);

  const setPlaybackQueue = useCallback((playbackQueue: QueueEntry[]) => setLibrary((current) => ({ ...current, playbackQueue: playbackQueue.slice(0, 100) })), []);

  const setCrossFamilyAutoAdvance = useCallback((allowCrossFamilyAutoAdvance: boolean) => setLibrary((current) => ({ ...current, allowCrossFamilyAutoAdvance })), []);

  const setSpokenPlaybackRate = useCallback((spokenPlaybackRate: PlaybackRate) => setLibrary((current) => ({ ...current, spokenPlaybackRate })), []);

  const setReadingGoalMode = useCallback((readingGoalMode: "AYAT" | "KHATMA", khatmaTargetDays?: number) => {
    setLibrary((current) => ({ ...current, readingGoalMode, khatmaTargetDays: khatmaTargetDays ?? current.khatmaTargetDays }));
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

  const setContinuousQuran = useCallback((continuousQuran: boolean) => setLibrary((current) => ({ ...current, continuousQuran })), []);

  const setMemorizationMode = useCallback((memorizationMode: boolean) => setLibrary((current) => ({ ...current, memorizationMode })), []);

  const setWifiOnlyDownloads = useCallback((wifiOnlyDownloads: boolean) => setLibrary((current) => ({ ...current, wifiOnlyDownloads })), []);
  const setAudioQuality = useCallback((audioQuality: AudioQuality) => setLibrary((current) => ({ ...current, audioQuality })), []);

  const removeHistoryItem = useCallback((surah: number) => {
    setLibrary((current) => ({ ...current, listeningHistory: current.listeningHistory.filter((item) => item.surah !== surah) }));
  }, []);

  const removeSpokenProgress = useCallback((contentId: string) => {
    setLibrary((current) => ({ ...current, spokenProgress: current.spokenProgress.filter((item) => item.contentId !== contentId) }));
  }, []);

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
      playlists: [{ id: crypto.randomUUID(), title: normalized, ayahKeys: [], spokenContentIds: [], itemOrder: [], allowMixedContent: false, createdAt: now, updatedAt: now }, ...current.playlists],
    }));
  }, []);

  const toggleSpokenInPlaylist = useCallback((playlistId: string, contentId: string) => {
    setLibrary((current) => ({ ...current, playlists: current.playlists.map((playlist) => {
      if (playlist.id !== playlistId) return playlist;
      if (!playlist.allowMixedContent && playlist.ayahKeys.length > 0 && !playlist.spokenContentIds.includes(contentId)) return playlist;
      const removing = playlist.spokenContentIds.includes(contentId);
      return { ...playlist, spokenContentIds: removing ? playlist.spokenContentIds.filter((id) => id !== contentId) : [...playlist.spokenContentIds, contentId], itemOrder: removing ? playlist.itemOrder.filter((id) => id !== `spoken:${contentId}`) : [...playlist.itemOrder, `spoken:${contentId}`], updatedAt: Date.now() };
    }) }));
  }, []);

  const removePlaylistFormat = useCallback((playlistId: string, format: "QURAN" | "SPOKEN") => {
    setLibrary((current) => ({ ...current, playlists: current.playlists.map((playlist) => {
      if (playlist.id !== playlistId) return playlist;
      if (format === "QURAN") return { ...playlist, ayahKeys: [], itemOrder: playlist.itemOrder.filter((item) => !item.startsWith("quran:")), allowMixedContent: false, updatedAt: Date.now() };
      return { ...playlist, spokenContentIds: [], itemOrder: playlist.itemOrder.filter((item) => !item.startsWith("spoken:")), allowMixedContent: false, updatedAt: Date.now() };
    }) }));
  }, []);

  const duplicatePlaylist = useCallback((playlistId: string) => {
    setLibrary((current) => {
      const source = current.playlists.find((item) => item.id === playlistId); if (!source) return current;
      const now = Date.now(); const copy = { ...source, id: crypto.randomUUID(), title: (source.title + " · copie").slice(0,80), ayahKeys: [...source.ayahKeys], spokenContentIds: [...source.spokenContentIds], itemOrder: [...source.itemOrder], createdAt: now, updatedAt: now };
      return { ...current, playlists: [copy, ...current.playlists] };
    });
  }, []);

  const setPlaylistMixedContent = useCallback((playlistId: string, allowMixedContent: boolean) => {
    setLibrary((current) => ({ ...current, playlists: current.playlists.map((playlist) => {
      if (playlist.id !== playlistId) return playlist;
      if (!allowMixedContent && playlist.ayahKeys.length > 0 && playlist.spokenContentIds.length > 0) return playlist;
      return { ...playlist, allowMixedContent, updatedAt: Date.now() };
    }) }));
  }, []);

  const toggleAyahInPlaylist = useCallback((playlistId: string, surah: number, ayah: number) => {
    const key = `${surah}:${ayah}`;
    setLibrary((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) => playlist.id !== playlistId ? playlist : (!playlist.allowMixedContent && playlist.spokenContentIds.length > 0 && !playlist.ayahKeys.includes(key)) ? playlist : {
        ...playlist,
        ayahKeys: playlist.ayahKeys.includes(key) ? playlist.ayahKeys.filter((item) => item !== key) : [...playlist.ayahKeys, key],
        itemOrder: playlist.ayahKeys.includes(key) ? playlist.itemOrder.filter((item) => item !== `quran:${key}`) : [...playlist.itemOrder, `quran:${key}`],
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
        itemOrder: playlist.itemOrder.filter((item) => item !== `quran:${key}`),
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

  const movePlaylistItem = useCallback((playlistId: string, fromIndex: number, toIndex: number) => {
    setLibrary((current) => ({ ...current, playlists: current.playlists.map((playlist) => {
      if (playlist.id !== playlistId || fromIndex < 0 || toIndex < 0 || fromIndex >= playlist.itemOrder.length || toIndex >= playlist.itemOrder.length) return playlist;
      const itemOrder = [...playlist.itemOrder]; const [moved] = itemOrder.splice(fromIndex,1); itemOrder.splice(toIndex,0,moved);
      return { ...playlist, itemOrder, updatedAt: Date.now() };
    }) }));
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
    toggleSpokenInPlaylist,
    setPlaylistMixedContent,
    duplicatePlaylist,
    removePlaylistFormat,
    deletePlaylist,
    movePlaylistAyah,
    movePlaylistItem,
    renamePlaylist,
    removeAyahFromPlaylist,
    exportData: () => JSON.stringify(library, null, 2),
    importData,
    setHistoryEnabled,
    removeHistoryItem,
    removeSpokenProgress,
    setWifiOnlyDownloads,
    setMemorizationMode,
    setContinuousQuran,
    hideRecommendation,
    restoreRecommendations,
    setReminderPreferences,
    setMemorizationRevealDelay,
    setReadingGoal,
    setReadingGoalMode,
    setSpokenPlaybackRate,
    setCrossFamilyAutoAdvance,
    setPlaybackQueue,
    saveSpokenProgress,
    removeSpokenProgress,
    clearSpokenProgress,
    toggleFollow,
    setFollowNotification,
    setAudioQuality,
    clearHistory: () => setLibrary((current) => ({ ...current, listeningHistory: [], spokenProgress: [], lastPositionMs: 0 })),
    clearPersonalData: () => setLibrary((current) => ({
      ...DEFAULT_LIBRARY,
      theme: current.theme,
      appearance: current.appearance,
      readingSize: current.readingSize,
      translationSize: current.translationSize,
    })),
  };
}
