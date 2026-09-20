/** One ordered sequence is the source of truth; legacy arrays remain compatible. */
export type StoredPlaylist = {
  id: string; title: string; ayahKeys: string[]; spokenContentIds: string[];
  itemOrder: string[]; allowMixedContent: boolean; createdAt: number; updatedAt: number;
};
const MAX_ITEMS = 500;
export function validPlaylistKey(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 256) return false;
  const quran = /^quran:(\d{1,3}):(\d{1,3})$/.exec(value);
  if (quran) return Number(quran[1]) >= 1 && Number(quran[1]) <= 114 && Number(quran[2]) >= 1 && Number(quran[2]) <= 286;
  return /^spoken:[^\s\u0000-\u001f]+$/.test(value);
}
export function playlistFamily(key: string): "QURAN" | "SPOKEN" {
  return key.startsWith("quran:") ? "QURAN" : "SPOKEN";
}
function withOrder(playlist: StoredPlaylist, keys: string[], now: number): StoredPlaylist {
  const itemOrder = [...new Set(keys.filter(validPlaylistKey))].slice(0, MAX_ITEMS);
  return { ...playlist, itemOrder,
    ayahKeys: itemOrder.filter(k => k.startsWith("quran:")).map(k => k.slice(6)),
    spokenContentIds: itemOrder.filter(k => k.startsWith("spoken:")).map(k => k.slice(7)),
    updatedAt: now };
}
export function normalizePlaylist(value: unknown): StoredPlaylist | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const p = value as Partial<StoredPlaylist>;
  if (typeof p.id !== "string" || !p.id.trim() || typeof p.title !== "string" || !p.title.trim()) return null;
  const quran = Array.isArray(p.ayahKeys) ? p.ayahKeys.filter(k => typeof k === "string").map(k => `quran:${k}`) : [];
  const spoken = Array.isArray(p.spokenContentIds) ? p.spokenContentIds.filter(k => typeof k === "string").map(k => `spoken:${k}`) : [];
  const members = [...new Set([...quran, ...spoken].filter(validPlaylistKey))];
  const ordered = Array.isArray(p.itemOrder) ? p.itemOrder.filter(k => validPlaylistKey(k) && members.includes(k)) : [];
  const now = Number.isFinite(p.updatedAt) ? Math.max(0, Number(p.updatedAt)) : 0;
  return withOrder({ id: p.id.slice(0, 128), title: p.title.trim().slice(0, 80), ayahKeys: [], spokenContentIds: [], itemOrder: [],
    allowMixedContent: p.allowMixedContent === true,
    createdAt: Number.isFinite(p.createdAt) ? Math.max(0, Number(p.createdAt)) : now, updatedAt: now },
    [...ordered, ...members], now);
}
export function normalizePlaylists(value: unknown): StoredPlaylist[] {
  if (!Array.isArray(value)) return [];
  const result: StoredPlaylist[] = [];
  for (const candidate of value) {
    const playlist = normalizePlaylist(candidate);
    if (playlist && !result.some(p => p.id === playlist.id)) result.push(playlist);
    if (result.length === 100) break;
  }
  return result;
}
export function addPlaylistItem(playlist: StoredPlaylist, key: string, now = Date.now()): StoredPlaylist {
  if (!validPlaylistKey(key) || playlist.itemOrder.includes(key) || playlist.itemOrder.length >= MAX_ITEMS) return playlist;
  if (!playlist.allowMixedContent && playlist.itemOrder.some(k => playlistFamily(k) !== playlistFamily(key))) return playlist;
  return withOrder(playlist, [...playlist.itemOrder, key], now);
}
export function removePlaylistItem(playlist: StoredPlaylist, key: string, now = Date.now()): StoredPlaylist {
  if (!playlist.itemOrder.includes(key)) return playlist;
  return withOrder(playlist, playlist.itemOrder.filter(k => k !== key), now);
}
export function togglePlaylistItem(playlist: StoredPlaylist, key: string, now = Date.now()): StoredPlaylist {
  return playlist.itemOrder.includes(key) ? removePlaylistItem(playlist, key, now) : addPlaylistItem(playlist, key, now);
}
export function movePlaylistEntry(playlist: StoredPlaylist, from: number, to: number, now = Date.now()): StoredPlaylist {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from === to || from < 0 || to < 0 || from >= playlist.itemOrder.length || to >= playlist.itemOrder.length) return playlist;
  const keys = [...playlist.itemOrder];
  const [key] = keys.splice(from, 1); keys.splice(to, 0, key);
  return withOrder(playlist, keys, now);
}
export type PlaylistRun = { playlistId: string; index: number; items: string[]; token: number };
export function startPlaylistRun(playlist: StoredPlaylist, index = 0, token = 1): PlaylistRun | null {
  return Number.isInteger(index) && index >= 0 && index < playlist.itemOrder.length
    ? { playlistId: playlist.id, index, items: [...playlist.itemOrder], token } : null;
}
export function nextPlaylistRun(run: PlaylistRun, finishedKey: string, allowCrossFamily: boolean): { type: "stale" | "end" | "consent" | "next"; run?: PlaylistRun } {
  if (run.items[run.index] !== finishedKey) return { type: "stale" };
  const next = run.items[run.index + 1];
  if (!next) return { type: "end" };
  if (playlistFamily(finishedKey) !== playlistFamily(next) && !allowCrossFamily) return { type: "consent" };
  return { type: "next", run: { ...run, index: run.index + 1, token: run.token + 1 } };
}
