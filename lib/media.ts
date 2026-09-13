export type MediaType = "quran" | "podcast" | "video" | "lecture" | "series";

export type PlaybackItem = {
  id: string;
  type: MediaType;
  title: string;
  subtitle?: string;
  artwork?: string;
  sourceUrl: string;
  duration?: number;
};

export type TranscriptSegment = {
  id: string;
  start: number;
  end: number;
  text: string;
  language: string;
};

export type QuranAyahSegment = TranscriptSegment & {
  surah: number;
  ayah: number;
  translation?: string;
  transliteration?: string;
};

export type ContentRightsStatus =
  | "RIGHTS_UNKNOWN"
  | "RIGHTS_REVIEW"
  | "RIGHTS_APPROVED"
  | "RIGHTS_REJECTED";
