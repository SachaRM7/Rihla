export type RevelationType = "Meccan" | "Medinan";

export type SurahSummary = {
  number: number;
  name: string;
  englishName: string;
  frenchName: string;
  revelationType: RevelationType;
  numberOfAyahs: number;
};

export type AyahPlayback = {
  number: number;
  numberInSurah: number;
  arabicText: string;
  frenchText: string;
  audioUrl: string;
};

export type SourceAttribution = {
  name: string;
  url: string;
  termsUrl: string;
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

export type ApiErrorResponse = {
  error: string;
};
