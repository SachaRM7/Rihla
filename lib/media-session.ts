export type MediaSessionPlaybackState = "none" | "paused" | "playing";

type MetadataOptions = {
  title: string;
  artist: string;
  album: string;
  artworkUrl?: string;
  actions: Partial<Record<MediaSessionAction, MediaSessionActionHandler | null>>;
};

type PlaybackOptions = {
  state: MediaSessionPlaybackState;
  duration?: number;
  position?: number;
  playbackRate?: number;
};

function getMediaSession() {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return null;
  return navigator.mediaSession;
}

export function setMediaSessionMetadata({ title, artist, album, artworkUrl, actions }: MetadataOptions) {
  const mediaSession = getMediaSession();
  if (!mediaSession) return;

  try {
    mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album,
      artwork: artworkUrl
        ? [{ src: artworkUrl, sizes: "512x512" }]
        : [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
    });
  } catch {
    mediaSession.metadata = new MediaMetadata({ title, artist, album });
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

export function setMediaSessionPlayback({ state, duration, position, playbackRate = 1 }: PlaybackOptions) {
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

export function clearMediaSession(actions: MediaSessionAction[]) {
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
