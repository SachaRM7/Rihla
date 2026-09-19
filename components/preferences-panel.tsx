"use client";

import { Check, MoveVertical, Palette, Type } from "lucide-react";
import {
  APPEARANCE_LABELS,
  APPEARANCE_MODES,
  COLOR_THEMES,
  READING_SIZES,
  READING_SIZE_LABELS,
  TRANSLATION_SIZES,
  TRANSLATION_SIZE_LABELS,
  type AppearanceMode,
  type ReadingSize,
  type ThemeId,
  type TranslationSize,
} from "@/lib/preferences";

type Props = {
  theme: ThemeId;
  appearance: AppearanceMode;
  readingSize: ReadingSize;
  translationSize: TranslationSize;
  autoScroll: boolean;
  showTranslation: boolean;
  onThemeChange: (theme: ThemeId) => void;
  onAppearanceChange: (appearance: AppearanceMode) => void;
  onReadingSizeChange: (size: ReadingSize) => void;
  onTranslationSizeChange: (size: TranslationSize) => void;
  onAutoScrollChange: (enabled: boolean) => void;
  onShowTranslationChange: (enabled: boolean) => void;
};

export function PreferencesPanel({
  theme,
  appearance,
  readingSize,
  translationSize,
  autoScroll,
  showTranslation,
  onThemeChange,
  onAppearanceChange,
  onReadingSizeChange,
  onTranslationSizeChange,
  onAutoScrollChange,
  onShowTranslationChange,
}: Props) {
  return (
    <div className="preferences-stack">
      <section className="preferences-section" aria-labelledby="reading-comfort-title">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Lecture</p>
            <h2 id="reading-comfort-title">Confort du texte</h2>
          </div>
          <Type size={20} aria-hidden="true" />
        </div>
        <p className="preferences-copy">Ajustez uniquement le Coran et sa traduction. Le reste de l’interface conserve sa taille.</p>

        <div className="reading-preview" aria-label="Aperçu de lecture">
          <p lang="ar" dir="rtl">إِنَّ مَعَ الْعُسْرِ يُسْرًا</p>
          {showTranslation && <span>Avec la difficulté vient certes la facilité.</span>}
        </div>

        <div className="reading-preferences">
          <div className="reading-size-setting">
            <span className="setting-label">Taille du texte</span>
            <div className="segmented-control" role="radiogroup" aria-label="Taille du texte du Coran">
              {READING_SIZES.map((size) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={readingSize === size}
                  className={readingSize === size ? "selected" : ""}
                  key={size}
                  onClick={() => onReadingSizeChange(size)}
                >
                  {READING_SIZE_LABELS[size]}
                </button>
              ))}
            </div>
          </div>

          <div className="reading-size-setting">
            <span className="setting-label">Taille de la traduction</span>
            <div className="segmented-control" role="radiogroup" aria-label="Taille de la traduction">
              {TRANSLATION_SIZES.map((size) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={translationSize === size}
                  className={translationSize === size ? "selected" : ""}
                  key={size}
                  onClick={() => onTranslationSizeChange(size)}
                >
                  {TRANSLATION_SIZE_LABELS[size]}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={showTranslation}
            className="setting-toggle"
            onClick={() => onShowTranslationChange(!showTranslation)}
          >
            <span className="setting-icon" aria-hidden="true"><Type size={18} /></span>
            <span className="setting-copy"><strong>Afficher la traduction</strong><small>Afficher le français sous chaque verset</small></span>
            <span className="switch-track" aria-hidden="true"><i /></span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={autoScroll}
            className="setting-toggle"
            onClick={() => onAutoScrollChange(!autoScroll)}
          >
            <span className="setting-icon" aria-hidden="true"><MoveVertical size={18} /></span>
            <span className="setting-copy">
              <strong>Suivi automatique</strong>
              <small>Centrer l’ayah active pendant la récitation</small>
            </span>
            <span className="switch-track" aria-hidden="true"><i /></span>
          </button>
        </div>
      </section>

      <section className="preferences-section" aria-labelledby="appearance-title">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Personnalisation</p>
            <h2 id="appearance-title">Thème de couleur</h2>
          </div>
          <Palette size={20} aria-hidden="true" />
        </div>
        <p className="preferences-copy">Le mode clair ou sombre est indépendant de votre couleur d’accent.</p>
        <div className="segmented-control appearance-control" role="radiogroup" aria-label="Apparence">
          {APPEARANCE_MODES.map((mode) => (
            <button
              type="button"
              role="radio"
              aria-checked={appearance === mode}
              className={appearance === mode ? "selected" : ""}
              key={mode}
              onClick={() => onAppearanceChange(mode)}
            >
              {APPEARANCE_LABELS[mode]}
            </button>
          ))}
        </div>
        <p className="setting-label accent-label">Couleur d’accent <small>Interface uniquement · jamais les couleurs de tajwid</small></p>
        <div className="theme-options" role="radiogroup" aria-label="Thème de couleur">
          {COLOR_THEMES.map((item) => {
            const selected = item.id === theme;
            return (
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                className={selected ? "selected" : ""}
                data-theme-choice={item.id}
                key={item.id}
                onClick={() => onThemeChange(item.id)}
              >
                <span className="theme-swatch" aria-hidden="true"><i />{selected && <Check size={15} />}</span>
                <strong>{item.label}</strong>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
