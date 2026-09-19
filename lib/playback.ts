import type { QuranReference } from "./domain";

export type PlaybackFamily = "QURAN" | "SPOKEN";
export type PlaybackState = "IDLE" | "LOADING" | "PLAYING" | "PAUSED" | "BUFFERING" | "ERROR";

export interface PlaybackItem {
  id: string;
  family: PlaybackFamily;
  title: string;
  subtitle?: string;
  artworkUrl?: string;
  mediaUrl: string;
  durationMs?: number;
  contentId?: string;
  recitationId?: string;
  quranReference?: QuranReference;
}

export interface QueueEntry {
  id: string;
  item: PlaybackItem;
  addedAt: string;
}

export interface PlaybackSnapshot {
  state: PlaybackState;
  current?: PlaybackItem;
  positionMs: number;
  durationMs?: number;
  queue: QueueEntry[];
  error?: PlaybackError;
}

export interface PlaybackError {
  code: "NETWORK" | "UNAVAILABLE" | "UNSUPPORTED" | "UNKNOWN";
  message: string;
  recoverable: boolean;
}

export const SPOKEN_SKIP_SECONDS = 15;

export type PlaybackCommand =
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "SEEK"; positionMs: number }
  | { type: "SKIP_BACK"; seconds?: number }
  | { type: "SKIP_FORWARD"; seconds?: number }
  | { type: "PLAY_ITEM"; item: PlaybackItem }
  | { type: "QUEUE_ADD"; entry: QueueEntry }
  | { type: "QUEUE_REMOVE"; entryId: string }
  | { type: "QUEUE_MOVE"; entryId: string; toIndex: number }
  | { type: "QUEUE_CLEAR" }
  | { type: "NEXT" }
  | { type: "PREVIOUS" };

export type PlaybackEvent =
  | { type: "STATE_CHANGED"; state: PlaybackState }
  | { type: "POSITION_CHANGED"; positionMs: number }
  | { type: "ITEM_CHANGED"; item?: PlaybackItem }
  | { type: "QUEUE_CHANGED"; queue: QueueEntry[] }
  | { type: "ERROR"; error: PlaybackError };

export interface PlaybackPreferences {
  spokenSpeed: number;
  recitationSpeed: number;
  autoAdvanceWithinFamily: boolean;
  allowCrossFamilyAutoAdvance: false;
}

export function skipTarget(item: PlaybackItem, positionMs: number, direction: "back" | "forward", seconds = SPOKEN_SKIP_SECONDS) {
  if (item.family !== "SPOKEN") return positionMs;
  const delta = Math.max(1, seconds) * 1000 * (direction === "back" ? -1 : 1);
  const target = positionMs + delta;
  return Math.min(Math.max(0, target), item.durationMs ?? Number.POSITIVE_INFINITY);
}

export function canAutoAdvance(from: PlaybackItem, to: PlaybackItem, preferences: PlaybackPreferences) {
  if (from.family !== to.family) return preferences.allowCrossFamilyAutoAdvance === true;
  return preferences.autoAdvanceWithinFamily;
}

export function requiresAutoAdvanceConsent(from: PlaybackItem, to: PlaybackItem) {
  return from.family !== to.family;
}

export function progressStorageKey(item: PlaybackItem) {
  return item.family === "QURAN"
    ? `quran-listening:${item.recitationId ?? item.id}`
    : `playback:${item.contentId ?? item.id}`;
}
