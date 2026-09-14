"use client";

import { Check, MoveVertical, Palette, Type } from "lucide-react";
import {
  COLOR_THEMES,
  READING_SIZES,
  READING_SIZE_LABELS,
  type ReadingSize,
  type ThemeId,
} from "@/lib/preferences";

type Props = {
  theme: ThemeId;
  readingSize: ReadingSize;
  autoScroll: boolean;
  onThemeChange: (theme: ThemeId) => void;
  onReadingSizeChange: (size: ReadingSize) => void;
  onAutoScrollChange: (enabled: boolean) => void;
};

export function PreferencesPanel({
  theme,
  readingSize,
  autoScroll,
  onThemeChange,
  onReadingSizeChange,
  onAutoScrollChange,
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
        <p className="preferences-copy">La couleur choisie s’applique à toute l’application et reste enregistrée sur cet appareil.</p>
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
