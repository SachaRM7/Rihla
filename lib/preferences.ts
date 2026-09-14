export type ThemeId = "olive" | "rose" | "orange" | "violet";

export const COLOR_THEMES: readonly { id: ThemeId; label: string }[] = [
  { id: "olive", label: "Olive" },
  { id: "rose", label: "Rose" },
  { id: "orange", label: "Orange" },
  { id: "violet", label: "Violet" },
] as const;

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;
export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

export const REPEAT_MODES = ["off", "3", "5", "10", "continuous"] as const;
export type RepeatMode = (typeof REPEAT_MODES)[number];

export const STUDY_LOOP_CYCLES = ["3", "5", "10", "continuous"] as const;
export type StudyLoopCycles = (typeof STUDY_LOOP_CYCLES)[number];

export type StudyLoopPreference = {
  surah: number;
  startAyah: number;
  endAyah: number;
  cycles: StudyLoopCycles;
};

export function isThemeId(value: unknown): value is ThemeId {
  return COLOR_THEMES.some((theme) => theme.id === value);
}

export function isPlaybackRate(value: unknown): value is PlaybackRate {
  return PLAYBACK_RATES.some((rate) => rate === value);
}

export function isRepeatMode(value: unknown): value is RepeatMode {
  return REPEAT_MODES.some((mode) => mode === value);
}

export function isStudyLoopCycles(value: unknown): value is StudyLoopCycles {
  return STUDY_LOOP_CYCLES.some((cycles) => cycles === value);
}

export function sanitizeStudyLoop(value: unknown): StudyLoopPreference | null {
  if (!value || typeof value !== "object") return null;
  const loop = value as Partial<StudyLoopPreference>;
  if (
    !Number.isInteger(loop.surah) ||
    loop.surah! < 1 ||
    loop.surah! > 114 ||
    !Number.isInteger(loop.startAyah) ||
    loop.startAyah! < 1 ||
    !Number.isInteger(loop.endAyah) ||
    loop.endAyah! < loop.startAyah! ||
    !isStudyLoopCycles(loop.cycles)
  ) {
    return null;
  }

  return {
    surah: loop.surah!,
    startAyah: loop.startAyah!,
    endAyah: loop.endAyah!,
    cycles: loop.cycles,
  };
}
