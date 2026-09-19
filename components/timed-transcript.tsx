"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Transcript, TranscriptSegment } from "@/lib/domain";
import { activeTranscriptSegment, searchTranscript, transcriptStatusLabel } from "@/lib/transcript";

type Props = {
  transcript: Transcript;
  segments: TranscriptSegment[];
  positionMs: number;
  onSeek: (positionMs: number) => void;
};

export function TimedTranscript({ transcript, segments, positionMs, onSeek }: Props) {
  const [query, setQuery] = useState("");
  const active = activeTranscriptSegment(transcript, segments, positionMs);
  const visible = useMemo(() => query.trim() ? searchTranscript(transcript, segments, query) : segments.filter((segment) => segment.transcriptId === transcript.id).sort((a,b) => a.position-b.position), [query, segments, transcript]);

  return <section className="timed-transcript" aria-label="Transcription synchronisée">
    <div className="transcript-header"><div><strong>Transcription</strong><small>{transcriptStatusLabel(transcript.status)}</small></div></div>
    <label className="transcript-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans la transcription" /></label>
    <div className="transcript-segments">
      {visible.map((segment) => <button type="button" className={active?.id === segment.id ? "active" : ""} key={segment.id} onClick={() => onSeek(segment.startMs)}>
        <time>{Math.floor(segment.startMs / 60000)}:{String(Math.floor(segment.startMs / 1000) % 60).padStart(2,"0")}</time><span>{segment.text}</span>
      </button>)}
    </div>
  </section>;
}
