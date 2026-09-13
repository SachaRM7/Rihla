"use client";

import { Heart, Search, X } from "lucide-react";
import type { SurahSummary } from "@/lib/quran/types";

type Props = {
  surahs: SurahSummary[];
  selectedNumber: number;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (number: number) => void;
  favoriteSurahs: number[];
  onToggleFavorite: (number: number) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();
}

export function SurahBrowser({
  surahs,
  selectedNumber,
  query,
  onQueryChange,
  onSelect,
  favoriteSurahs,
  onToggleFavorite,
  loading = false,
  error,
  onRetry,
  showSearch = true,
  searchPlaceholder = "Nom ou numéro d’une sourate",
}: Props) {
  const normalizedQuery = normalize(query);
  const filtered = normalizedQuery
    ? surahs.filter((surah) =>
        [
          String(surah.number),
          surah.name,
          surah.englishName,
          surah.frenchName,
        ].some((value) => normalize(value).includes(normalizedQuery)),
      )
    : surahs;

  return (
    <section className="surah-browser" aria-labelledby="surah-browser-title">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Le Livre</p>
          <h2 id="surah-browser-title">Les 114 sourates</h2>
        </div>
        {!loading && !error && <span className="result-count">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>}
      </div>

      {showSearch && (
        <label className="search-control">
          <Search size={19} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Rechercher une sourate, une ayah ou un mot"
          />
          {query && (
            <button type="button" onClick={() => onQueryChange("")} aria-label="Effacer la recherche">
              <X size={18} />
            </button>
          )}
        </label>
      )}

      {loading && (
        <div className="status-card" role="status">
          <span className="loading-ring" aria-hidden="true" />
          <div><strong>Chargement du Coran</strong><p>Connexion à la source des sourates…</p></div>
        </div>
      )}

      {error && (
        <div className="status-card error-card" role="alert">
          <div><strong>Impossible de charger les sourates</strong><p>{error}</p></div>
          {onRetry && <button type="button" className="secondary-action" onClick={onRetry}>Réessayer</button>}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="status-card">
          <div><strong>Aucune sourate trouvée</strong><p>Essayez un autre nom ou un numéro entre 1 et 114.</p></div>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="surah-list" aria-live="polite">
          {filtered.map((surah) => {
            const isFavorite = favoriteSurahs.includes(surah.number);
            const isSelected = selectedNumber === surah.number;
            return (
              <article className={`surah-row ${isSelected ? "selected" : ""}`} key={surah.number}>
                <button
                  type="button"
                  className="surah-select"
                  onClick={() => onSelect(surah.number)}
                  aria-label={`Ouvrir la sourate ${surah.frenchName}, numéro ${surah.number}`}
                >
                  <span className="surah-index">{String(surah.number).padStart(3, "0")}</span>
                  <span className="surah-label">
                    <strong>{surah.englishName}</strong>
                    <small>{surah.frenchName} · {surah.numberOfAyahs} ayat</small>
                  </span>
                  <span className="surah-arabic-name" lang="ar" dir="rtl" translate="no">{surah.name}</span>
                </button>
                <button
                  type="button"
                  className={`favorite-button ${isFavorite ? "active" : ""}`}
                  onClick={() => onToggleFavorite(surah.number)}
                  aria-label={isFavorite ? "Retirer cette sourate des favoris" : "Ajouter cette sourate aux favoris"}
                  aria-pressed={isFavorite}
                >
                  <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
