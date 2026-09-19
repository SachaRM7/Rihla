import type { MediaChapter } from "./domain";

export function activeMediaChapter(chapters: MediaChapter[], positionMs: number) {
  const ordered = [...chapters].sort((a, b) => a.position - b.position);
  return ordered.find((chapter, index) => {
    const next = ordered[index + 1];
    const end = chapter.endMs ?? next?.startMs ?? Number.POSITIVE_INFINITY;
    return positionMs >= chapter.startMs && positionMs < end;
  }) ?? null;
}

export function formatChapterTime(milliseconds: number) {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0 ? `${hours}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}` : `${minutes}:${String(seconds).padStart(2,"0")}`;
}
