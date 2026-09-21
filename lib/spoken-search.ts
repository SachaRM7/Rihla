import type { CatalogBundle } from "./catalog";
import type { ContentItem, Creator } from "./domain";

export type SpokenDurationFilter = "all" | "short" | "medium" | "long";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[-_'’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function estimatedDurationMs(item: ContentItem, catalog: CatalogBundle) {
  const durations = item.mediaAssetIds
    .map((id) => catalog.media.find((media) => media.id === id)?.durationMs)
    .filter((value): value is number => Number.isFinite(value));
  return durations.length ? Math.min(...durations) : undefined;
}

function durationMatches(durationMs: number | undefined, filter: SpokenDurationFilter) {
  if (filter === "all") return true;
  if (!durationMs) return false;
  const minutes = durationMs / 60_000;
  if (filter === "short") return minutes <= 10;
  if (filter === "medium") return minutes > 10 && minutes <= 30;
  return minutes > 30;
}

export function searchSpokenCatalog(
  catalog: CatalogBundle,
  query: string,
  filters: {
    language?: string;
    duration?: SpokenDurationFilter;
    creatorId?: string;
  } = {},
) {
  const needle = normalize(query);
  return catalog.contents
    .filter((item) => item.status === "PUBLISHED")
    .filter((item) => !filters.language || item.language === filters.language)
    .filter((item) => !filters.creatorId || item.creatorIds.includes(filters.creatorId))
    .filter((item) => durationMatches(estimatedDurationMs(item, catalog), filters.duration ?? "all"))
    .filter((item) => {
      if (!needle) return true;
      const creators = item.creatorIds
        .map((id) => catalog.creators.find((creator) => creator.id === id)?.name ?? "")
        .join(" ");
      const haystack = normalize([item.title, item.description ?? "", creators].join(" "));
      return haystack.includes(needle);
    })
    .map((item) => ({
      item,
      durationMs: estimatedDurationMs(item, catalog),
      creators: item.creatorIds
        .map((id) => catalog.creators.find((creator) => creator.id === id))
        .filter((creator): creator is Creator => Boolean(creator)),
    }));
}

export function spokenFilterOptions(catalog: CatalogBundle, query: string) {
  const base = searchSpokenCatalog(catalog, query);
  const languages = [...new Set(base.map(({ item }) => item.language))];
  const creatorIds = [...new Set(base.flatMap(({ item }) => item.creatorIds))];
  const creators = creatorIds
    .map((id) => catalog.creators.find((creator) => creator.id === id))
    .filter((creator): creator is Creator => Boolean(creator));
  const hasDurations = base.some(({ durationMs }) => Boolean(durationMs));
  return { languages, creators, hasDurations };
}

export function formatMediaDuration(durationMs?: number) {
  if (!durationMs) return null;
  const totalMinutes = Math.max(1, Math.round(durationMs / 60_000));
  if (totalMinutes < 60) return totalMinutes + " min";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? hours + " h " + String(minutes).padStart(2, "0") : hours + " h";
}
