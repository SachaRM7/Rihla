"use client";

import { Check, Palette } from "lucide-react";
import { COLOR_THEMES, type ThemeId } from "@/lib/preferences";

type Props = {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
};

export function PreferencesPanel({ theme, onThemeChange }: Props) {
  return (
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
  );
}
