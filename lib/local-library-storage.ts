import type { LocalLibrary } from "@/hooks/use-local-library";
import { LOCAL_LIBRARY_SCHEMA_VERSION } from "@/lib/local-library-schema";

const LEGACY_KEY = "rihla.library.v1";
const SLICE_PREFIX = "rihla.library.v2.";

const SLICE_KEYS = {
  meta: `${SLICE_PREFIX}meta`,
  quran: `${SLICE_PREFIX}quran`,
  spoken: `${SLICE_PREFIX}spoken`,
  preferences: `${SLICE_PREFIX}preferences`,
  collections: `${SLICE_PREFIX}collections`,
} as const;

type StorageReader = (key: string) => string | null;
type StorageWriter = (key: string, value: string) => void;

function parse(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

/** Reads the v2 slices first, then falls back to the v1 monolith for migration. */
export function readLocalLibraryStorage(read: StorageReader) {
  const slices = Object.fromEntries(Object.entries(SLICE_KEYS).map(([name, key]) => [name, parse(read(key))])) as Record<string, Record<string, unknown> | null>;
  const hasSlice = Object.values(slices).some(Boolean);
  if (hasSlice) {
    return {
      version: LOCAL_LIBRARY_SCHEMA_VERSION,
      ...(slices.meta ?? {}),
      ...(slices.quran ?? {}),
      ...(slices.spoken ?? {}),
      ...(slices.preferences ?? {}),
      ...(slices.collections ?? {}),
    };
  }
  return parse(read(LEGACY_KEY));
}

/** Writes independent bounded slices, so one corrupted area cannot discard the rest. */
export function writeLocalLibraryStorage(library: LocalLibrary, write: StorageWriter) {
  const { version, lastSurah, lastAyah, lastPositionMs, reciterId, quranReadingSurah, quranReadingAyah, quranReadingUpdatedAt, favoriteSurahs, favoriteAyahs, listeningHistory, ayahNotes, readingDays, playlists, follows, hiddenRecommendations, spokenProgress, spokenPlaybackRate, playbackQueue, theme, appearance, readingSize, translationSize, autoScroll, playbackRate, repeatMode, showTranslation, studyLoop, historyEnabled, wifiOnlyDownloads, audioQuality, memorizationMode, continuousQuran, remindersEnabled, reminderTime, memorizationRevealDelay, readingGoalEnabled, readingGoalAyahsPerDay, readingGoalMode, khatmaTargetDays, allowCrossFamilyAutoAdvance } = library;
  write(SLICE_KEYS.meta, JSON.stringify({ version, lastSurah, lastAyah, lastPositionMs, reciterId, quranReadingSurah, quranReadingAyah, quranReadingUpdatedAt }));
  write(SLICE_KEYS.quran, JSON.stringify({ favoriteSurahs, favoriteAyahs, listeningHistory, ayahNotes, readingDays }));
  write(SLICE_KEYS.spoken, JSON.stringify({ spokenProgress, spokenPlaybackRate, playbackQueue, allowCrossFamilyAutoAdvance }));
  write(SLICE_KEYS.preferences, JSON.stringify({ theme, appearance, readingSize, translationSize, autoScroll, playbackRate, repeatMode, showTranslation, studyLoop, historyEnabled, wifiOnlyDownloads, audioQuality, memorizationMode, continuousQuran, remindersEnabled, reminderTime, memorizationRevealDelay, readingGoalEnabled, readingGoalAyahsPerDay, readingGoalMode, khatmaTargetDays }));
  write(SLICE_KEYS.collections, JSON.stringify({ playlists, follows, hiddenRecommendations }));
}

export const localLibraryStorageKeys = { legacy: LEGACY_KEY, slices: SLICE_KEYS } as const;
