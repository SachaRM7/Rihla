"use client";

import { ListTree } from "lucide-react";
import type { MediaChapter } from "@/lib/domain";
import { activeMediaChapter, formatChapterTime } from "@/lib/media-chapters";

type Props = { chapters: MediaChapter[]; positionMs: number; onSeek: (positionMs: number) => void };

export function MediaChapters({ chapters, positionMs, onSeek }: Props) {
  const active = activeMediaChapter(chapters, positionMs);
  return <section className="media-chapters" aria-label="Chapitres">
    <div className="transcript-header"><div><strong>Chapitres</strong><small>Accéder directement à un sujet</small></div><ListTree size={18} /></div>
    <div className="chapter-list">{[...chapters].sort((a,b)=>a.position-b.position).map((chapter) => <button type="button" key={chapter.id} className={active?.id === chapter.id ? "active" : ""} onClick={() => onSeek(chapter.startMs)}><time>{formatChapterTime(chapter.startMs)}</time><span>{chapter.title}</span></button>)}</div>
  </section>;
}
