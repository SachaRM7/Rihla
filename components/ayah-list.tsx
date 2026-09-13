"use client";

import { Heart, Play, Share2 } from "lucide-react";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { SurahDetail, TajwidTextRun } from "@/lib/quran/types";

type Props = {
  detail: SurahDetail;
  activeIndex: number;
  isPlaying: boolean;
  currentTime: number;
  favoriteAyahs: string[];
  showTranslation: boolean;
  onSelect: (index: number) => void;
  onToggleFavorite: (ayahNumber: number) => void;
  onShare: (ayahNumber: number) => void;
};

type KaraokeStyle = CSSProperties & { "--word-progress": string };

function getWordProgress(elapsedMs: number, startMs: number, endMs: number, active: boolean) {
  if (!active) return 1;
  if (elapsedMs <= startMs) return 0;
  if (elapsedMs >= endMs) return 1;
  return (elapsedMs - startMs) / (endMs - startMs);
}

function TajwidRuns({ runs }: { runs: TajwidTextRun[] }) {
  return runs.map((run, index) => (
    <span data-tajwid={run.rule} key={`${run.rule ?? "plain"}-${index}`}>
      {run.text}
    </span>
  ));
}

export function AyahList({
  detail,
  activeIndex,
  isPlaying,
  currentTime,
  favoriteAyahs,
  showTranslation,
  onSelect,
  onToggleFavorite,
  onShare,
}: Props) {
  const activeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeIndex]);

  return (
    <section className="ayah-section" aria-labelledby="ayah-list-title">
      <div className="ayah-heading">
        <div>
          <p className="eyebrow">Karaoké fluide · Tajwid</p>
          <h2 id="ayah-list-title">{detail.surah.englishName}</h2>
          <p>{detail.surah.frenchName} · {detail.surah.numberOfAyahs} ayat</p>
        </div>
        <span className="arabic-heading" lang="ar" dir="rtl" translate="no">{detail.surah.name}</span>
        <details className="tajwid-legend">
          <summary>Code couleur</summary>
          <div>
            <span><i data-color="madd" />Prolongation</span>
            <span><i data-color="ghunnah" />Nasalisation</span>
            <span><i data-color="ikhfa" />Dissimulation</span>
            <span><i data-color="idgham" />Fusion</span>
            <span><i data-color="qalqalah" />Rebond</span>
          </div>
        </details>
      </div>

      <div className="ayah-list">
        {detail.ayahs.map((ayah, index) => {
          const key = `${detail.surah.number}:${ayah.numberInSurah}`;
          const isFavorite = favoriteAyahs.includes(key);
          const isActive = activeIndex === index;
          const elapsedMs = currentTime * 1000;
          const karaokeActive = isActive && (isPlaying || currentTime > 0);

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
                <div className="ayah-meta-actions">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => onShare(ayah.numberInSurah)}
                    aria-label={`Partager l’ayah ${ayah.numberInSurah}`}
                  >
                    <Share2 size={16} />
                  </button>
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
              </div>
              <button
                type="button"
                className={`ayah-select ${showTranslation ? "" : "translation-hidden"}`}
                onClick={() => onSelect(index)}
                aria-label={`Lire ${detail.surah.englishName}, ayah ${ayah.numberInSurah}`}
              >
                <span
                  className={`ayah-arabic ayah-words ${karaokeActive ? "karaoke-active" : ""}`}
                  lang="ar"
                  dir="rtl"
                  translate="no"
                  aria-label={ayah.arabicText}
                >
                  {ayah.words.map((word) => {
                    const progress = getWordProgress(
                      elapsedMs,
                      word.startMs,
                      word.endMs,
                      karaokeActive,
                    );
                    const isCurrentWord = karaokeActive && progress > 0 && progress < 1;
                    const style: KaraokeStyle = { "--word-progress": `${progress * 100}%` };
                    return (
                      <span
                        aria-hidden="true"
                        className={`ayah-word ${isCurrentWord ? "current" : ""}`}
                        key={`${ayah.number}-${word.position}`}
                        style={style}
                      >
                        <span className="ayah-word-base"><TajwidRuns runs={word.tajwid} /></span>
                        <span className="ayah-word-fill"><TajwidRuns runs={word.tajwid} /></span>
                      </span>
                    );
                  })}
                </span>
                {showTranslation && <span className="ayah-translation" lang="fr">{ayah.frenchText}</span>}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
