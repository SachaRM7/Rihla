export type MediaSessionPlaybackState = "none" | "paused" | "playing";

type MetadataOptions = {
  title: string;
  artist?: string;
  album: string;
  artworkUrl?: string;
  actions: Partial<Record<MediaSessionAction, MediaSessionActionHandler | null>>;
  /** Metadata claims ownership; playback updates and cleanup must match it. */
  owner?: string;
};

type PlaybackOptions = {
  state: MediaSessionPlaybackState;
  duration?: number;
  position?: number;
  playbackRate?: number;
  owner?: string;
};

// A previously mounted Quran player must not clear a spoken player's session.
let activeOwner: string | null = null;
let ownerSequence = 0;

export function createMediaSessionOwner(label: string) {
  ownerSequence += 1;
  return `${label}:${ownerSequence}`;
}

export function isMediaSessionOwner(owner: string) {
  return activeOwner === owner;
}

function getMediaSession() {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return null;
  return navigator.mediaSession;
}

export function setMediaSessionMetadata({ title, artist, album, artworkUrl, actions, owner }: MetadataOptions) {
  if (owner !== undefined) activeOwner = owner;

  const mediaSession = getMediaSession();
  if (!mediaSession) return;

  const resolvedArtist = artist ?? "RIHLA";
  if (typeof MediaMetadata === "function") try {
    mediaSession.metadata = new MediaMetadata({
      title,
      artist: resolvedArtist,
      album,
      artwork: artworkUrl
        ? [{ src: artworkUrl, sizes: "512x512" }]
        : [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
    });
  } catch {
    mediaSession.metadata = new MediaMetadata({ title, artist: resolvedArtist, album });
  }

  for (const [action, handler] of Object.entries(actions) as Array<[
    MediaSessionAction,
    MediaSessionActionHandler | null,
  ]>) {
    try {
      mediaSession.setActionHandler(action, handler);
    } catch {
      // Browsers can reject actions they do not expose on the current device.
    }
  }
}

export function setMediaSessionPlayback({ state, duration, position, playbackRate = 1, owner }: PlaybackOptions) {
  if (owner !== undefined && activeOwner !== owner) return;

  const mediaSession = getMediaSession();
  if (!mediaSession) return;

  mediaSession.playbackState = state;
  if (!duration || duration <= 0 || !Number.isFinite(duration)) return;

  try {
    mediaSession.setPositionState({
      duration,
      playbackRate: playbackRate > 0 && Number.isFinite(playbackRate) ? playbackRate : 1,
      position: Math.min(Math.max(position ?? 0, 0), duration),
    });
  } catch {
    // Position state is optional and can be rejected while metadata is loading.
  }
}

export function clearMediaSession(actions: MediaSessionAction[], owner?: string) {
  // A session that has already been taken over by another player must not be
  // torn down by the previous owner's cleanup.
  if (owner !== undefined && activeOwner !== null && activeOwner !== owner) return;
  if (owner !== undefined) activeOwner = null;

  const mediaSession = getMediaSession();
  if (!mediaSession) return;

  for (const action of actions) {
    try {
      mediaSession.setActionHandler(action, null);
    } catch {
      // Ignore unsupported actions during cleanup.
    }
  }
  mediaSession.metadata = null;
  mediaSession.playbackState = "none";
}
