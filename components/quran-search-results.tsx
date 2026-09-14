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
};

export function QuranSearchResults({ query, onOpen }: Props) {
  const normalizedQuery = query.trim();
  const [results, setResults] = useState<QuranSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (normalizedQuery.length < 2) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setResults([]);
      setError(null);
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

  if (normalizedQuery.length < 2) return null;

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
