"use client";

import { BookOpenText, ChevronRight, LoaderCircle, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  ApiErrorResponse,
  QuranSearchHit,
  QuranSearchResponse,
} from "@/lib/quran/types";

type Props = {
  query: string;
  onOpen: (surah: number, ayah: number) => void;
  onQueryChange?: (value: string) => void;
};

export function QuranSearchResults({ query, onOpen, onQueryChange }: Props) {
  const normalizedQuery = query.trim();
  const [results, setResults] = useState<QuranSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("rihla.search.recent") ?? "[]");
      if (Array.isArray(stored)) setRecent(stored.filter((item): item is string => typeof item === "string").slice(0, 6));
    } catch {}
  }, []);

  useEffect(() => {
    if (normalizedQuery.length < 2) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setResults([]);
      setError(null);
      setSuggestion(null);
      try {
        const response = await fetch(
          `/api/quran/search?q=${encodeURIComponent(normalizedQuery)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as QuranSearchResponse | ApiErrorResponse;
        if (!response.ok || !("data" in payload)) {
          throw new Error("error" in payload ? payload.error : "Réponse invalide.");
        }
        setResults(payload.data);
        if (payload.data.length === 0) {
          const simplified = normalizedQuery.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/s$/i, "");
          if (simplified !== normalizedQuery.toLocaleLowerCase("fr") && simplified.length >= 2) setSuggestion(simplified);
        }
        setRecent((current) => {
          const next = [normalizedQuery, ...current.filter((item) => item.toLocaleLowerCase("fr") !== normalizedQuery.toLocaleLowerCase("fr"))].slice(0, 6);
          try { localStorage.setItem("rihla.search.recent", JSON.stringify(next)); } catch {}
          return next;
        });
      } catch (searchError) {
        if (controller.signal.aborted) return;
        setResults([]);
        setError(
          searchError instanceof Error
            ? searchError.message
            : "La recherche est indisponible.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt, normalizedQuery]);

  if (normalizedQuery.length < 2) {
    if (recent.length === 0) return null;
    return (
      <section className="recent-searches" aria-labelledby="recent-search-title">
        <div className="section-title-row"><div><p className="eyebrow">Reprendre</p><h2 id="recent-search-title">Recherches récentes</h2></div></div>
        <div className="recent-search-chips">
          {recent.map((item) => <button type="button" key={item} onClick={() => onQueryChange?.(item)}>{item}</button>)}
        </div>
      </section>
    );
  }

  return (
    <section className="quran-search-results" aria-labelledby="ayah-search-title">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Dans la traduction française</p>
          <h2 id="ayah-search-title">Ayat correspondantes</h2>
        </div>
        {!loading && !error && (
          <span className="result-count">
            {results.length} résultat{results.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading && (
        <div className="status-card" role="status">
          <LoaderCircle className="spin" size={22} />
          <div><strong>Recherche dans le Coran</strong><p>Analyse des traductions françaises…</p></div>
        </div>
      )}

      {error && (
        <div className="status-card error-card" role="alert">
          <SearchX size={22} />
          <div><strong>Recherche indisponible</strong><p>{error}</p></div>
          <button type="button" className="secondary-action" onClick={() => setAttempt((value) => value + 1)}>Réessayer</button>
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="empty-library compact">
          <SearchX size={22} />
          <strong>Aucune ayah trouvée</strong>
          <p>Essayez un autre mot ou une référence comme 2:255.</p>
          {suggestion && <button type="button" className="text-action" onClick={() => onQueryChange?.(suggestion)}>Essayer « {suggestion} »</button>}
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="ayah-search-grid" aria-live="polite">
          {results.map((result) => (
            <button
              type="button"
              className="ayah-search-hit"
              key={`${result.number}-${result.surahNumber}:${result.numberInSurah}`}
              onClick={() => onOpen(result.surahNumber, result.numberInSurah)}
            >
              <span className="search-hit-reference">{result.surahNumber}:{result.numberInSurah}</span>
              <span className="search-hit-copy">
                <strong>{result.surahEnglishName}</strong>
                <span>{result.frenchText}</span>
              </span>
              <span className="search-hit-action" aria-hidden="true"><BookOpenText size={17} /><ChevronRight size={16} /></span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
