import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AyahNote, ListeningHistoryItem, LocalLibrary, PersonalPlaylist, SpokenProgress } from "@/hooks/use-local-library";
import { DEFAULT_LIBRARY, sanitizeLibrary } from "@/hooks/use-local-library";
import type { Database, Json } from "@/lib/supabase/database.types";
import { LOCAL_LIBRARY_SCHEMA_VERSION } from "@/lib/local-library-schema";

type Client = SupabaseClient<Database>;
type SyncRows = {
  favorites: Database["public"]["Tables"]["user_favorites"]["Row"][];
  bookmarks: Database["public"]["Tables"]["user_bookmarks"]["Row"][];
  notes: Database["public"]["Tables"]["user_notes"]["Row"][];
  playlists: Database["public"]["Tables"]["user_playlists"]["Row"][];
  playlistItems: Database["public"]["Tables"]["user_playlist_items"]["Row"][];
  spokenProgress: Database["public"]["Tables"]["user_playback_progress"]["Row"][];
  quranReading: Database["public"]["Tables"]["user_quran_reading_progress"]["Row"] | null;
  quranListening: Database["public"]["Tables"]["user_quran_listening_progress"]["Row"][];
  preferences: Database["public"]["Tables"]["user_preferences"]["Row"][];
  follows: Database["public"]["Tables"]["user_follows"]["Row"][];
  latestEvent: Database["public"]["Tables"]["user_sync_events"]["Row"] | null;
};

export type CloudSyncStatus = "disabled" | "idle" | "syncing" | "synced" | "offline" | "error";

const SNAPSHOT_KEY = "library.v1";
const OUTBOX_KEY = "rihla.sync.outbox.v1";
const INITIALIZED_PREFIX = "rihla.sync.initialized.";

function nowIso() {
  return new Date().toISOString();
}

function nowMs() {
  return Date.now();
}

function getDeviceId() {
  const key = "rihla.device.id";
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(key, created);
    return created;
  } catch {
    return `browser-${crypto.randomUUID()}`;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asJson(value: unknown) {
  return value as Json;
}

function readSnapshot(value: unknown): LocalLibrary | null {
  const candidate = isRecord(value) && "library" in value ? value.library : value;
  return isRecord(candidate) && candidate.version === LOCAL_LIBRARY_SCHEMA_VERSION ? sanitizeLibrary(candidate) : null;
}

function itemUpdatedAt(value: { updatedAt?: number } | null | undefined) {
  return Number.isFinite(value?.updatedAt) ? Number(value?.updatedAt) : 0;
}

function mergeByKey<T>(local: T[], remote: T[], key: (item: T) => string, updatedAt?: (item: T) => number) {
  const merged = new Map(local.map((item) => [key(item), item]));
  for (const item of remote) {
    const existing = merged.get(key(item));
    if (!existing || (updatedAt && updatedAt(item) > updatedAt(existing))) merged.set(key(item), item);
  }
  return [...merged.values()];
}

function mergeReadingDays(local: LocalLibrary["readingDays"], remote: LocalLibrary["readingDays"]) {
  const days = new Set([...Object.keys(local), ...Object.keys(remote)]);
  return Object.fromEntries([...days].sort().slice(-120).map((day) => [
    day,
    [...new Set([...(local[day] ?? []), ...(remote[day] ?? [])])].slice(0, 200),
  ]));
}

function mergePlaylists(local: PersonalPlaylist[], remote: PersonalPlaylist[]) {
  return mergeByKey(local, remote, (item) => item.id, itemUpdatedAt).map((playlist) => ({
    ...playlist,
    ayahKeys: [...new Set(playlist.ayahKeys)],
    spokenContentIds: [...new Set(playlist.spokenContentIds)],
    itemOrder: [...new Set(playlist.itemOrder)],
  }));
}

function mergeNotes(local: AyahNote[], remote: AyahNote[]) {
  return mergeByKey(local, remote, (item) => `${item.surah}:${item.ayah}`, itemUpdatedAt).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 250);
}

function mergeHistory(local: ListeningHistoryItem[], remote: ListeningHistoryItem[]) {
  return mergeByKey(local, remote, (item) => `${item.surah}:${item.ayah}`, itemUpdatedAt).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 24);
}

function mergeSpokenProgress(local: SpokenProgress[], remote: SpokenProgress[]) {
  return mergeByKey(local, remote, (item) => item.contentId, itemUpdatedAt).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 100);
}

function mergeFollows(local: LocalLibrary["follows"], remote: LocalLibrary["follows"]) {
  return mergeByKey(local, remote, (item) => `${item.type}:${item.id}`);
}

/** Merge guest data and reconnecting devices without making destructive writes. */
export function mergeLibraries(local: LocalLibrary, remote: LocalLibrary) {
  const localHasData = JSON.stringify(local) !== JSON.stringify(DEFAULT_LIBRARY);
  const primary = localHasData ? local : remote;
  const secondary = localHasData ? remote : local;
  const latestReading = remote.quranReadingUpdatedAt > local.quranReadingUpdatedAt ? remote : local;

  return sanitizeLibrary({
    ...primary,
    favoriteSurahs: [...new Set([...local.favoriteSurahs, ...remote.favoriteSurahs])],
    favoriteAyahs: [...new Set([...local.favoriteAyahs, ...remote.favoriteAyahs])],
    listeningHistory: mergeHistory(local.listeningHistory, remote.listeningHistory),
    ayahNotes: mergeNotes(local.ayahNotes, remote.ayahNotes),
    playlists: mergePlaylists(local.playlists, remote.playlists),
    quranReadingSurah: latestReading.quranReadingSurah,
    quranReadingAyah: latestReading.quranReadingAyah,
    quranReadingUpdatedAt: latestReading.quranReadingUpdatedAt,
    hiddenRecommendations: [...new Set([...local.hiddenRecommendations, ...remote.hiddenRecommendations])].slice(0, 100),
    readingDays: mergeReadingDays(local.readingDays, remote.readingDays),
    follows: mergeFollows(local.follows, remote.follows),
    spokenProgress: mergeSpokenProgress(local.spokenProgress, remote.spokenProgress),
    playbackQueue: primary.playbackQueue.length ? primary.playbackQueue : secondary.playbackQueue,
    lastSurah: latestReading === remote ? remote.lastSurah : local.lastSurah,
    lastAyah: latestReading === remote ? remote.lastAyah : local.lastAyah,
    lastPositionMs: latestReading === remote ? remote.lastPositionMs : local.lastPositionMs,
    reciterId: primary.reciterId,
  });
}

function rowError(label: string, error: { message: string } | null) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

async function readRows(client: Client, userId: string): Promise<SyncRows> {
  const [favorites, bookmarks, notes, playlists, playlistItems, spokenProgress, quranReading, quranListening, preferences, follows, latestEvent] = await Promise.all([
    client.from("user_favorites").select("*").eq("user_id", userId),
    client.from("user_bookmarks").select("*").eq("user_id", userId),
    client.from("user_notes").select("*").eq("user_id", userId),
    client.from("user_playlists").select("*").eq("user_id", userId),
    client.from("user_playlist_items").select("*").order("position", { ascending: true }),
    client.from("user_playback_progress").select("*").eq("user_id", userId),
    client.from("user_quran_reading_progress").select("*").eq("user_id", userId).maybeSingle(),
    client.from("user_quran_listening_progress").select("*").eq("user_id", userId),
    client.from("user_preferences").select("*").eq("user_id", userId),
    client.from("user_follows").select("*").eq("user_id", userId),
    client.from("user_sync_events").select("*").eq("user_id", userId).eq("entity", "library").eq("entity_id", SNAPSHOT_KEY).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  rowError("Lecture des favoris", favorites.error);
  rowError("Lecture des marque-pages", bookmarks.error);
  rowError("Lecture des notes", notes.error);
  rowError("Lecture des playlists", playlists.error);
  rowError("Lecture des éléments de playlist", playlistItems.error);
  rowError("Lecture de la progression audio", spokenProgress.error);
  rowError("Lecture de la progression de lecture", quranReading.error);
  rowError("Lecture de la progression Coran", quranListening.error);
  rowError("Lecture des préférences", preferences.error);
  rowError("Lecture des abonnements", follows.error);
  rowError("Lecture de l’historique de synchronisation", latestEvent.error);

  return {
    favorites: favorites.data ?? [],
    bookmarks: bookmarks.data ?? [],
    notes: notes.data ?? [],
    playlists: playlists.data ?? [],
    playlistItems: playlistItems.data ?? [],
    spokenProgress: spokenProgress.data ?? [],
    quranReading: quranReading.data,
    quranListening: quranListening.data ?? [],
    preferences: preferences.data ?? [],
    follows: follows.data ?? [],
    latestEvent: latestEvent.data,
  };
}

function rowsToLibrary(rows: SyncRows) {
  const favoriteSurahs = rows.favorites.filter((item) => item.target_kind === "QURAN_SURAH").map((item) => Number(item.target_id)).filter(Number.isInteger);
  const favoriteAyahs = [
    ...rows.favorites.filter((item) => item.target_kind === "QURAN_AYAH").map((item) => item.target_id),
    ...rows.bookmarks.filter((item) => item.target_kind === "QURAN").map((item) => item.target_id),
  ];
  const ayahNotes = rows.notes
    .filter((item) => item.target_kind === "QURAN_AYAH")
    .map((item) => {
      const [surah, ayah] = item.target_id.split(":").map(Number);
      return { surah, ayah, text: item.body, updatedAt: Date.parse(item.updated_at) };
    });
  const itemsByPlaylist = new Map<string, typeof rows.playlistItems>();
  for (const item of rows.playlistItems) itemsByPlaylist.set(item.playlist_id, [...(itemsByPlaylist.get(item.playlist_id) ?? []), item]);
  const playlists = rows.playlists.map((playlist) => {
    const items = [...(itemsByPlaylist.get(playlist.id) ?? [])].sort((a, b) => a.position - b.position);
    const ayahKeys = items.filter((item) => item.item_type === "QURAN_AYAH").map((item) => item.item_id);
    const spokenContentIds = items.filter((item) => item.item_type === "CONTENT").map((item) => item.item_id);
    return {
      id: playlist.id,
      title: playlist.title,
      ayahKeys,
      spokenContentIds,
      itemOrder: items.map((item) => item.item_type === "QURAN_AYAH" ? `quran:${item.item_id}` : `spoken:${item.item_id}`),
      allowMixedContent: playlist.allow_mixed_content,
      createdAt: Date.parse(playlist.created_at),
      updatedAt: Date.parse(playlist.updated_at),
    } satisfies PersonalPlaylist;
  });
  const listeningHistory = rows.quranListening.flatMap((row) => {
    const reference = isRecord(row.reference) ? row.reference : {};
    return Array.isArray(reference.items) ? reference.items : [];
  });
  const quranHistory = listeningHistory.filter((item): item is ListeningHistoryItem => isRecord(item) && Number.isInteger(item.surah) && Number.isInteger(item.ayah) && Number.isFinite(item.updatedAt));
  const latestQuran = [...quranHistory].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  const spokenProgress = rows.spokenProgress.map((item) => ({
    contentId: item.content_id,
    positionMs: item.position_ms,
    durationMs: item.duration_ms ?? 0,
    updatedAt: Date.parse(item.updated_at),
  }));
  const follows = rows.follows.map((item) => ({ id: item.target_id, type: item.target_type, notify: item.notify_new_publications }));

  return sanitizeLibrary({
    ...DEFAULT_LIBRARY,
    favoriteSurahs,
    favoriteAyahs,
    ayahNotes,
    playlists,
    listeningHistory: quranHistory,
    spokenProgress,
    quranReadingSurah: rows.quranReading?.surah ?? 1,
    quranReadingAyah: rows.quranReading?.ayah ?? 1,
    quranReadingUpdatedAt: rows.quranReading ? Date.parse(rows.quranReading.updated_at) : 0,
    lastSurah: latestQuran?.surah ?? 1,
    lastAyah: latestQuran?.ayah ?? 1,
    lastPositionMs: latestQuran?.positionMs ?? 0,
    reciterId: latestQuran?.reciterId ?? DEFAULT_LIBRARY.reciterId,
    follows,
  });
}

export async function pullCloudLibrary(client: Client, userId: string) {
  const rows = await readRows(client, userId);
  const preference = rows.preferences.find((item) => item.preference_key === SNAPSHOT_KEY);
  return readSnapshot(preference?.value) ?? readSnapshot(rows.latestEvent?.payload) ?? rowsToLibrary(rows);
}

async function insertChunks<T>(insert: (rows: T[]) => Promise<{ error: { message: string } | null }>, rows: T[]) {
  for (let index = 0; index < rows.length; index += 100) rowError("Écriture de la synchronisation", (await insert(rows.slice(index, index + 100))).error);
}

function stableUuid(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) hash = Math.imul(hash ^ input.charCodeAt(index), 16777619);
  let value = (hash >>> 0).toString(16).padStart(8, "0");
  for (let index = 0; index < 4; index += 1) {
    hash = Math.imul(hash ^ (index + 1), 16777619);
    value += (hash >>> 0).toString(16).padStart(8, "0");
  }
  const hex = value.slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function pushCloudLibrary(client: Client, user: User, library: LocalLibrary) {
  const userId = user.id;
  const deviceId = getDeviceId();
  const updatedAt = nowIso();
  const snapshot = { schemaVersion: library.version, updatedAt: nowMs(), deviceId, library };

  rowError("Écriture des préférences", (await client.from("user_preferences").upsert([
    { user_id: userId, preference_key: SNAPSHOT_KEY, value: asJson(snapshot), updated_at: updatedAt },
    { user_id: userId, preference_key: "reading.goal", value: asJson({ enabled: library.readingGoalEnabled, mode: library.readingGoalMode, ayahsPerDay: library.readingGoalAyahsPerDay, targetDays: library.khatmaTargetDays }), updated_at: updatedAt },
    { user_id: userId, preference_key: "recommendations.hidden", value: asJson(library.hiddenRecommendations), updated_at: updatedAt },
    { user_id: userId, preference_key: "playback.queue", value: asJson(library.playbackQueue), updated_at: updatedAt },
  ], { onConflict: "user_id,preference_key" })).error);

  await insertChunks((rows) => client.from("user_favorites").upsert(rows, { onConflict: "id" }), [
    ...library.favoriteSurahs.map((surah) => ({ id: stableUuid(`${userId}:favorite:surah:${surah}`), user_id: userId, target_kind: "QURAN_SURAH", target_id: String(surah) })),
    ...library.favoriteAyahs.map((ayah) => ({ id: stableUuid(`${userId}:favorite:ayah:${ayah}`), user_id: userId, target_kind: "QURAN_AYAH", target_id: ayah })),
  ]);

  await insertChunks((rows) => client.from("user_bookmarks").upsert(rows, { onConflict: "id" }), library.favoriteAyahs.map((ayah) => ({ id: stableUuid(`${userId}:bookmark:${ayah}`), user_id: userId, target_kind: "QURAN", target_id: ayah, position_ms: null, note: null })));

  await insertChunks((rows) => client.from("user_notes").upsert(rows, { onConflict: "user_id,target_kind,target_id" }), library.ayahNotes.map((note) => {
    const timestamp = new Date(note.updatedAt).toISOString();
    return { id: stableUuid(`${userId}:note:${note.surah}:${note.ayah}`), user_id: userId, target_kind: "QURAN_AYAH", target_id: `${note.surah}:${note.ayah}`, body: note.text, created_at: timestamp, updated_at: timestamp };
  }));

  const playlistRows = library.playlists.map((playlist) => ({
    id: isUuid(playlist.id) ? playlist.id : stableUuid(`${userId}:playlist:${playlist.id}`),
    user_id: userId,
    title: playlist.title,
    allow_mixed_content: playlist.allowMixedContent,
    created_at: new Date(playlist.createdAt).toISOString(),
    updated_at: new Date(playlist.updatedAt).toISOString(),
  }));
  await insertChunks((rows) => client.from("user_playlists").upsert(rows, { onConflict: "id" }), playlistRows);
  await insertChunks((rows) => client.from("user_playlist_items").upsert(rows, { onConflict: "id" }), playlistRows.flatMap((playlist, playlistIndex) => {
    const source = library.playlists[playlistIndex];
    return source.itemOrder.map((item, position) => {
      const isQuran = item.startsWith("quran:");
      return { id: stableUuid(`${playlist.id}:${position}`), playlist_id: playlist.id, position, item_type: isQuran ? "QURAN_AYAH" : "CONTENT", item_id: isQuran ? item.slice(6) : item.slice(7) };
    });
  }));

  if (library.quranReadingUpdatedAt > 0) rowError("Écriture de la progression de lecture", (await client.from("user_quran_reading_progress").upsert({ user_id: userId, surah: library.quranReadingSurah, ayah: library.quranReadingAyah, updated_at: new Date(library.quranReadingUpdatedAt).toISOString() }, { onConflict: "user_id" })).error);

  const historyByReciter = new Map<string, ListeningHistoryItem[]>();
  for (const item of library.listeningHistory) historyByReciter.set(item.reciterId, [...(historyByReciter.get(item.reciterId) ?? []), item]);
  await insertChunks((rows) => client.from("user_quran_listening_progress").upsert(rows, { onConflict: "user_id,recitation_id" }), [...historyByReciter.entries()].map(([recitationId, items]) => ({
    user_id: userId,
    recitation_id: recitationId,
    reference: asJson({ items }),
    position_ms: recitationId === library.reciterId ? library.lastPositionMs : items[0]?.positionMs ?? 0,
    updated_at: updatedAt,
  })));

  await insertChunks((rows) => client.from("user_playback_progress").upsert(rows, { onConflict: "user_id,content_id" }), library.spokenProgress.map((item) => ({
    user_id: userId,
    content_id: item.contentId,
    position_ms: item.positionMs,
    duration_ms: item.durationMs,
    completed: item.durationMs > 0 && item.positionMs >= item.durationMs - 1_000,
    updated_at: new Date(item.updatedAt).toISOString(),
  })));

  await insertChunks((rows) => client.from("user_follows").upsert(rows, { onConflict: "user_id,target_type,target_id" }), library.follows.map((follow) => ({ user_id: userId, target_type: follow.type, target_id: follow.id, notify_new_publications: follow.notify })));

  rowError("Écriture de l’événement de synchronisation", (await client.from("user_sync_events").insert({
    user_id: userId,
    device_id: deviceId,
    entity: "library",
    operation: "UPSERT",
    entity_id: SNAPSHOT_KEY,
    payload: asJson(snapshot),
    client_updated_at: updatedAt,
  })).error);
}

export async function syncCloudLibrary(client: Client, user: User, local: LocalLibrary) {
  const remote = await pullCloudLibrary(client, user.id);
  const merged = mergeLibraries(local, remote);
  await pushCloudLibrary(client, user, merged);
  return merged;
}

export function syncInitializedKey(userId: string) {
  return `${INITIALIZED_PREFIX}${userId}`;
}

export function saveSyncOutbox(userId: string, library: LocalLibrary) {
  try {
    window.localStorage.setItem(OUTBOX_KEY, JSON.stringify({ userId, library, savedAt: nowMs() }));
  } catch {
    // Offline mode remains usable even when localStorage is unavailable.
  }
}

export function clearSyncOutbox() {
  try { window.localStorage.removeItem(OUTBOX_KEY); } catch { /* best effort */ }
}

export function hasSyncOutbox(userId: string) {
  try {
    const raw = window.localStorage.getItem(OUTBOX_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { userId?: string };
    return parsed.userId === userId;
  } catch {
    return false;
  }
}
