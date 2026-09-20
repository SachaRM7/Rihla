/** Shared by both players: only the active owner may play or edit MediaSession. */
let owner: { key: object; interrupt: () => void } | null = null;
export function claimPlayback(key: object, interrupt: () => void) {
  if (owner?.key === key) return;
  const previous = owner;
  owner = { key, interrupt };
  previous?.interrupt();
}
export function ownsPlayback(key: object) { return owner?.key === key; }
export function releasePlayback(key: object) { if (owner?.key === key) owner = null; }
