import type { Transcript, TranscriptSegment } from "./domain";

export function activeTranscriptSegment(
  transcript: Transcript,
  segments: TranscriptSegment[],
  positionMs: number,
) {
  return segments.find((segment) =>
    segment.transcriptId === transcript.id &&
    positionMs >= segment.startMs &&
    positionMs < segment.endMs
  ) ?? null;
}

export function searchTranscript(
  transcript: Transcript,
  segments: TranscriptSegment[],
  query: string,
) {
  const normalized = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
  if (!normalized) return [];
  return segments
    .filter((segment) => segment.transcriptId === transcript.id)
    .filter((segment) => segment.text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").includes(normalized))
    .sort((a, b) => a.position - b.position);
}

export function transcriptStatusLabel(status: Transcript["status"]) {
  if (status === "VALIDATED") return "Transcription validée";
  if (status === "CORRECTED") return "Transcription corrigée";
  return "Transcription automatique";
}
