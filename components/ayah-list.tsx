"use client";

import { Heart, Play } from "lucide-react";
import { useEffect, useRef } from "react";
import type { SurahDetail } from "@/lib/quran/types";

type Props = {
  detail: SurahDetail;
  activeIndex: number;
  isPlaying: boolean;
  favoriteAyahs: string[];
  onSelect: (index: number) => void;
  onToggleFavorite: (ayahNumber: number) => void;
};

export function AyahList({
  detail,
  activeIndex,
  isPlaying,
  favoriteAyahs,
  onSelect,
  onToggleFavorite,
}: Props) {
  const activeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeIndex]);

  return (
    <section className="ayah-section" aria-labelledby="ayah-list-title">
      <div className="ayah-heading">
        <div>
          <p className="eyebrow">Texte synchronisé par ayah</p>
          <h2 id="ayah-list-title">{detail.surah.englishName}</h2>
          <p>{detail.surah.frenchName} · {detail.surah.numberOfAyahs} ayat</p>
        </div>
        <span className="arabic-heading" lang="ar" dir="rtl" translate="no">{detail.surah.name}</span>
      </div>

      <div className="ayah-list">
        {detail.ayahs.map((ayah, index) => {
          const key = `${detail.surah.number}:${ayah.numberInSurah}`;
          const isFavorite = favoriteAyahs.includes(key);
          const isActive = activeIndex === index;

          return (
            <article
              key={ayah.number}
              ref={isActive ? activeRef : undefined}
              className={`ayah-card ${isActive ? "active" : ""}`}
              aria-current={isActive ? "true" : undefined}
            >
              <div className="ayah-meta">
                <span>{detail.surah.number}:{ayah.numberInSurah}</span>
                {isActive && (
                  <span className="now-playing" aria-label={isPlaying ? "Ayah en lecture" : "Ayah sélectionnée"}>
                    {isPlaying ? <span className="audio-bars" aria-hidden="true"><i /><i /><i /></span> : <Play size={14} />}
                    {isPlaying ? "En lecture" : "Sélectionnée"}
                  </span>
                )}
                <button
                  type="button"
                  className={`favorite-button ${isFavorite ? "active" : ""}`}
                  onClick={() => onToggleFavorite(ayah.numberInSurah)}
                  aria-label={isFavorite ? "Retirer cette ayah des favoris" : "Ajouter cette ayah aux favoris"}
                  aria-pressed={isFavorite}
                >
                  <Heart size={17} fill={isFavorite ? "currentColor" : "none"} />
                </button>
              </div>
              <button
                type="button"
                className="ayah-select"
                onClick={() => onSelect(index)}
                aria-label={`Lire ${detail.surah.englishName}, ayah ${ayah.numberInSurah}`}
              >
                <span className="ayah-arabic" lang="ar" dir="rtl" translate="no">{ayah.arabicText}</span>
                <span className="ayah-translation" lang="fr">{ayah.frenchText}</span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
