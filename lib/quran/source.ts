import {
  DEFAULT_RECITER_ID,
  FRENCH_SURAH_NAMES,
  FRENCH_TRANSLATION_ID,
  QURAN_SOURCE,
  RECITERS,
  isAllowedReciter,
} from "./constants";
import type {
  AyahPlayback,
  RevelationType,
  SurahCatalogResponse,
  SurahDetail,
  SurahSummary,
} from "./types";

const API_ROOT = "https://api.alquran.cloud/v1";
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

  const [audioPayload, translationPayload] = await Promise.all([
    fetchEnvelope(`/surah/${number}/${encodeURIComponent(requestedReciter)}`),
    fetchEnvelope(`/surah/${number}/${FRENCH_TRANSLATION_ID}`),
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

  const ayahs: AyahPlayback[] = audioAyahs.map((audioAyah, index) => {
    const translationAyah = translationAyahs[index];
    const globalNumber = Number(audioAyah.number);
    const numberInSurah = Number(audioAyah.numberInSurah);

    if (
      !Number.isInteger(globalNumber) ||
      !Number.isInteger(numberInSurah) ||
      typeof audioAyah.text !== "string" ||
      typeof audioAyah.audio !== "string" ||
      !audioAyah.audio.startsWith("https://") ||
      typeof translationAyah?.text !== "string"
    ) {
      throw new Error("Invalid ayah");
    }

    return {
      number: globalNumber,
      numberInSurah,
      arabicText: audioAyah.text,
      frenchText: translationAyah.text,
      audioUrl: audioAyah.audio,
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
