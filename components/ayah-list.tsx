"use client";

import { BookOpenText, Bookmark, ListPlus, MoreHorizontal, Navigation, Share2, StickyNote } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { SurahDetail, TajwidTextRun } from "@/lib/quran/types";

type Props = {
  detail: SurahDetail;
  activeIndex: number;
  isPlaying: boolean;
  currentTime: number;
  favoriteAyahs: string[];
  showTranslation: boolean;
  autoScroll: boolean;
  continuousView?: boolean;
  onSelect: (index: number) => void;
  onToggleFavorite: (ayahNumber: number) => void;
  onEditNote: (ayahNumber: number) => void;
  onShare: (ayahNumber: number) => void;
  onAddToPlaylist: (ayahNumber: number) => void;
  onOpenTafsir: (ayahNumber: number) => void;
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
  autoScroll,
  continuousView = false,
  onSelect,
  onToggleFavorite,
  onEditNote,
  onShare,
  onAddToPlaylist,
  onOpenTafsir,
}: Props) {
  const activeRef = useRef<HTMLElement | null>(null);
  const [followSuspended, setFollowSuspended] = useState(false);

  useEffect(() => {
    if (!autoScroll || followSuspended) return;
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeIndex, autoScroll, followSuspended]);

  return (
    <section className="ayah-section" aria-labelledby="ayah-list-title">
      <div className="ayah-heading">
        <div>
          <p className="eyebrow">Lecture · Tajwid</p>
          <h2 id="ayah-list-title">{detail.surah.englishName}</h2>
          <p>{detail.surah.frenchName} · {detail.surah.numberOfAyahs} ayat</p>
        </div>
        <span className="arabic-heading" lang="ar" dir="rtl" translate="no">{detail.surah.name}</span>
        <details className="tajwid-legend">
          <summary>Couleurs de tajwid</summary>
          <div><p className="tajwid-help">Ces couleurs indiquent des règles de tajwid. La surbrillance olive du verset indique uniquement le suivi audio.</p>
            <span><i data-color="madd" />Prolongation</span>
            <span><i data-color="ghunnah" />Nasalisation</span>
            <span><i data-color="ikhfa" />Dissimulation</span>
            <span><i data-color="idgham" />Fusion</span>
            <span><i data-color="qalqalah" />Rebond</span>
          </div>
        </details>
      </div>

      {autoScroll && followSuspended && (
        <button
          type="button"
          className="return-to-current"
          onClick={() => {
            setFollowSuspended(false);
            activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        >
          <Navigation size={16} aria-hidden="true" /> Revenir au verset en cours
        </button>
      )}

      <div
        className="ayah-list"
        onWheel={() => setFollowSuspended(true)}
        onTouchMove={() => setFollowSuspended(true)}
      >
        {detail.ayahs.map((ayah, index) => {
          const key = `${detail.surah.number}:${ayah.numberInSurah}`;
          const isFavorite = favoriteAyahs.includes(key);
          const isActive = activeIndex === index;
          const isPast = index < activeIndex;
          const elapsedMs = currentTime * 1000;
          const karaokeActive = isActive && (isPlaying || currentTime > 0);

          return (
            <article
              key={ayah.number}
              ref={isActive ? activeRef : undefined}
              className={`ayah-card ${isActive ? "active" : ""} ${continuousView ? "continuous" : ""}`}
              aria-current={isActive ? "true" : undefined}
            >
              <div className="ayah-meta">
                <span>{detail.surah.number}:{ayah.numberInSurah}</span>
                <div className="ayah-meta-actions">
                  <details className="ayah-more">
                    <summary className="icon-button" aria-label={`Options de l’ayah ${ayah.numberInSurah}`} title="Options">
                      <MoreHorizontal size={18} aria-hidden="true" />
                    </summary>
                    <div className="ayah-more-menu">
                      <button type="button" onClick={() => onEditNote(ayah.numberInSurah)}><StickyNote size={16} /> Ajouter une note</button>
                      <button type="button" onClick={() => onOpenTafsir(ayah.numberInSurah)}><BookOpenText size={16} /> Tafsir & sources</button>
                      <button type="button" onClick={() => onAddToPlaylist(ayah.numberInSurah)}><ListPlus size={16} /> Ajouter à une playlist</button>
                      <button type="button" onClick={() => onShare(ayah.numberInSurah)}><Share2 size={16} /> Partager</button>
                    </div>
                  </details>
                  <button
                    type="button"
                    className={`favorite-button ${isFavorite ? "active" : ""}`}
                    onClick={() => onToggleFavorite(ayah.numberInSurah)}
                    aria-label={isFavorite ? "Retirer le marque-page" : "Ajouter un marque-page"}
                    aria-pressed={isFavorite}
                  >
                    <Bookmark size={17} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
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
                    const progress = karaokeActive
                      ? getWordProgress(elapsedMs, word.startMs, word.endMs, true)
                      : isPast
                        ? 1
                        : 0;
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
                {showTranslation && (
                  <span className={`ayah-translation ${karaokeActive ? "active-translation" : ""}`} lang="fr">
                    {ayah.frenchText}
                  </span>
                )}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
