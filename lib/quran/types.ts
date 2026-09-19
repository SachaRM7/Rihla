export type RevelationType = "Meccan" | "Medinan";

export type SurahSummary = {
  number: number;
  name: string;
  englishName: string;
  frenchName: string;
  revelationType: RevelationType;
  numberOfAyahs: number;
};

export type AyahTranslation = {
  id: string;
  language: "fr";
  name: string;
  author: string;
  text: string;
  sourceUrl?: string;
};

export type AyahPlayback = {
  number: number;
  numberInSurah: number;
  arabicText: string;
  frenchText: string;
  translations?: AyahTranslation[];
  audioUrl: string;
  words: AyahWordTiming[];
};

export type AyahWordTiming = {
  position: number;
  text: string;
  tajwid: TajwidTextRun[];
  startMs: number;
  endMs: number;
};

export type TajwidTextRun = {
  text: string;
  rule?: string;
};

export type SourceAttribution = {
  name: string;
  url: string;
  termsUrl: string;
  translationName?: string;
  translationAuthor?: string;
};

export type SurahDetail = {
  surah: SurahSummary;
  reciterId: string;
  reciterName: string;
  ayahs: AyahPlayback[];
  source: SourceAttribution;
};

export type Reciter = {
  id: string;
  name: string;
  bitrate: number;
};

export type SurahCatalogResponse = {
  data: SurahSummary[];
  source: SourceAttribution;
};

export type SurahDetailResponse = {
  data: SurahDetail;
};

export type QuranSearchHit = {
  number: number;
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
  numberInSurah: number;
  frenchText: string;
};

export type QuranSearchResponse = {
  data: QuranSearchHit[];
};

export type ApiErrorResponse = {
  error: string;
};
