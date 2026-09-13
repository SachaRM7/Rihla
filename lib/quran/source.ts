import {
  DEFAULT_RECITER_ID,
  FRENCH_SURAH_NAMES,
  FRENCH_TRANSLATION_ID,
  QURAN_SOURCE,
  QURAN_FOUNDATION_RECITATION_ID,
  RECITERS,
  isAllowedReciter,
} from "./constants";
import type {
  AyahPlayback,
  RevelationType,
  SurahCatalogResponse,
  SurahDetail,
  SurahSummary,
  AyahWordTiming,
} from "./types";

const API_ROOT = "https://api.alquran.cloud/v1";
const QURAN_FOUNDATION_API_ROOT = "https://api.quran.com/api/v4";
const QURAN_FOUNDATION_AUDIO_ROOT = "https://verses.quran.foundation";
const REQUEST_TIMEOUT_MS = 9_000;

type UpstreamAyah = {
  number?: unknown;
  numberInSurah?: unknown;
  text?: unknown;
  audio?: unknown;
};

type UpstreamSurah = {
  number?: unknown;
  name?: unknown;
  englishName?: unknown;
  revelationType?: unknown;
  numberOfAyahs?: unknown;
  ayahs?: unknown;
};

type UpstreamEnvelope = {
  code?: unknown;
  status?: unknown;
  data?: unknown;
};

type QuranFoundationWord = {
  position?: unknown;
  text_uthmani?: unknown;
  char_type_name?: unknown;
};

type QuranFoundationAudio = {
  url?: unknown;
  segments?: unknown;
};

type QuranFoundationVerse = {
  verse_key?: unknown;
  verse_number?: unknown;
  text_uthmani?: unknown;
  words?: unknown;
  audio?: unknown;
};

type QuranFoundationPage = {
  verses?: unknown;
  pagination?: {
    total_pages?: unknown;
  };
};

function isRevelationType(value: unknown): value is RevelationType {
  return value === "Meccan" || value === "Medinan";
}

function normalizeSummary(value: UpstreamSurah): SurahSummary {
  const number = Number(value.number);
  const numberOfAyahs = Number(value.numberOfAyahs);

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 114 ||
    !Number.isInteger(numberOfAyahs) ||
    numberOfAyahs < 1 ||
    typeof value.name !== "string" ||
    typeof value.englishName !== "string" ||
    !isRevelationType(value.revelationType)
  ) {
    throw new Error("Invalid surah metadata");
  }

  return {
    number,
    name: value.name,
    englishName: value.englishName,
    frenchName: FRENCH_SURAH_NAMES[number - 1] ?? value.englishName,
    revelationType: value.revelationType,
    numberOfAyahs,
  };
}

async function fetchEnvelope(path: string): Promise<UpstreamEnvelope> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_ROOT}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 86_400 },
    });

    if (!response.ok) {
      throw new Error(`Upstream HTTP ${response.status}`);
    }

    const payload = (await response.json()) as UpstreamEnvelope;
    if (payload.code !== 200 || payload.status !== "OK") {
      throw new Error("Upstream payload rejected");
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchQuranFoundationPage(path: string): Promise<QuranFoundationPage> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${QURAN_FOUNDATION_API_ROOT}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 86_400 },
    });

    if (!response.ok) {
      throw new Error(`Quran Foundation HTTP ${response.status}`);
    }

    return (await response.json()) as QuranFoundationPage;
  } finally {
    clearTimeout(timeout);
  }
}

async function getTimedVerses(chapterNumber: number): Promise<QuranFoundationVerse[]> {
  const params = new URLSearchParams({
    words: "true",
    word_fields: "text_uthmani,char_type_name",
    fields: "text_uthmani",
    audio: String(QURAN_FOUNDATION_RECITATION_ID),
    per_page: "50",
  });
  const path = `/verses/by_chapter/${chapterNumber}?${params.toString()}`;
  const firstPage = await fetchQuranFoundationPage(path);
  const firstVerses = Array.isArray(firstPage.verses)
    ? (firstPage.verses as QuranFoundationVerse[])
    : [];
  const totalPages = Number(firstPage.pagination?.total_pages ?? 1);

  if (!Number.isInteger(totalPages) || totalPages < 1 || firstVerses.length === 0) {
    throw new Error("Invalid Quran Foundation verse payload");
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchQuranFoundationPage(`${path}&page=${index + 2}`),
    ),
  );

  return [
    ...firstVerses,
    ...remainingPages.flatMap((page) =>
      Array.isArray(page.verses) ? (page.verses as QuranFoundationVerse[]) : [],
    ),
  ];
}

function normalizeTimedVerse(value: QuranFoundationVerse) {
  const verseNumber = Number(value.verse_number);
  const audio = value.audio as QuranFoundationAudio | undefined;
  const relativeAudioUrl = typeof audio?.url === "string" ? audio.url.replace(/^\/+/, "") : "";
  const words = Array.isArray(value.words)
    ? (value.words as QuranFoundationWord[]).filter((word) => word.char_type_name === "word")
    : [];
  const segments = Array.isArray(audio?.segments) ? audio.segments : [];
  const timingsByPosition = new Map<number, { startMs: number; endMs: number }>();

  for (const rawSegment of segments) {
    if (!Array.isArray(rawSegment) || rawSegment.length < 4) continue;
    const position = Number(rawSegment[1]);
    const startMs = Number(rawSegment[2]);
    const endMs = Number(rawSegment[3]);
    if (
      Number.isInteger(position) &&
      position > 0 &&
      Number.isFinite(startMs) &&
      Number.isFinite(endMs) &&
      endMs > startMs
    ) {
      timingsByPosition.set(position, { startMs, endMs });
    }
  }

  const timedWords: AyahWordTiming[] = words.flatMap((word) => {
    const position = Number(word.position);
    const timing = timingsByPosition.get(position);
    if (!Number.isInteger(position) || typeof word.text_uthmani !== "string" || !timing) return [];
    return [{ position, text: word.text_uthmani, ...timing }];
  });

  if (
    !Number.isInteger(verseNumber) ||
    verseNumber < 1 ||
    typeof value.text_uthmani !== "string" ||
    !relativeAudioUrl ||
    timedWords.length === 0
  ) {
    throw new Error("Invalid timed verse data");
  }

  return {
    verseNumber,
    arabicText: value.text_uthmani.trim(),
    audioUrl: `${QURAN_FOUNDATION_AUDIO_ROOT}/${relativeAudioUrl}`,
    words: timedWords,
  };
}

export async function getSurahCatalog(): Promise<SurahCatalogResponse> {
  const payload = await fetchEnvelope("/surah");
  if (!Array.isArray(payload.data)) {
    throw new Error("Invalid catalog");
  }

  const data = payload.data.map((item) => normalizeSummary(item as UpstreamSurah));
  if (data.length !== 114) {
    throw new Error("Incomplete catalog");
  }

  return { data, source: QURAN_SOURCE };
}

export async function getSurahDetail(
  number: number,
  requestedReciter = DEFAULT_RECITER_ID,
): Promise<SurahDetail> {
  if (!Number.isInteger(number) || number < 1 || number > 114) {
    throw new RangeError("Invalid surah number");
  }

  if (!isAllowedReciter(requestedReciter)) {
    throw new RangeError("Invalid reciter");
  }

  const [audioPayload, translationPayload, timedVersePayload] = await Promise.all([
    fetchEnvelope(`/surah/${number}/${encodeURIComponent(requestedReciter)}`),
    fetchEnvelope(`/surah/${number}/${FRENCH_TRANSLATION_ID}`),
    getTimedVerses(number),
  ]);

  const audioSurah = audioPayload.data as UpstreamSurah;
  const translationSurah = translationPayload.data as UpstreamSurah;
  const audioAyahs = Array.isArray(audioSurah?.ayahs) ? (audioSurah.ayahs as UpstreamAyah[]) : [];
  const translationAyahs = Array.isArray(translationSurah?.ayahs)
    ? (translationSurah.ayahs as UpstreamAyah[])
    : [];

  if (audioAyahs.length === 0 || audioAyahs.length !== translationAyahs.length) {
    throw new Error("Incomplete ayah data");
  }

  const timedVerses = new Map(
    timedVersePayload.map((verse) => {
      const normalized = normalizeTimedVerse(verse);
      return [normalized.verseNumber, normalized] as const;
    }),
  );

  if (timedVerses.size !== audioAyahs.length) {
    throw new Error("Incomplete word timing data");
  }

  const ayahs: AyahPlayback[] = audioAyahs.map((audioAyah, index) => {
    const translationAyah = translationAyahs[index];
    const globalNumber = Number(audioAyah.number);
    const numberInSurah = Number(audioAyah.numberInSurah);
    const timedVerse = timedVerses.get(numberInSurah);

    if (
      !Number.isInteger(globalNumber) ||
      !Number.isInteger(numberInSurah) ||
      typeof audioAyah.text !== "string" ||
      typeof audioAyah.audio !== "string" ||
      !audioAyah.audio.startsWith("https://") ||
      typeof translationAyah?.text !== "string" ||
      !timedVerse
    ) {
      throw new Error("Invalid ayah");
    }

    return {
      number: globalNumber,
      numberInSurah,
      arabicText: timedVerse.arabicText,
      frenchText: translationAyah.text,
      audioUrl: timedVerse.audioUrl,
      words: timedVerse.words,
    };
  });

  const reciter = RECITERS.find((item) => item.id === requestedReciter);
  if (!reciter) {
    throw new RangeError("Invalid reciter");
  }

  return {
    surah: normalizeSummary(audioSurah),
    reciterId: reciter.id,
    reciterName: reciter.name,
    ayahs,
    source: QURAN_SOURCE,
  };
}
