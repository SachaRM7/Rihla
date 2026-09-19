"use client";

import { BookOpenText, Home, Library, Search } from "lucide-react";

export type AppView = "home" | "search" | "quran" | "library" | "settings";

const items = [
  { id: "home" as const, label: "Accueil", icon: Home },
  { id: "search" as const, label: "Recherche", icon: Search },
  { id: "quran" as const, label: "Coran", icon: BookOpenText },
  { id: "library" as const, label: "Bibliothèque", icon: Library },
];

type Props = {
  activeView: AppView;
  onChange: (view: AppView) => void;
};

export function MobileNavigation({ activeView, onChange }: Props) {
  return (
    <nav className="mobile-navigation" aria-label="Navigation principale">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={activeView === id ? "active" : ""}
          aria-current={activeView === id ? "page" : undefined}
          onClick={() => onChange(id)}
        >
          <Icon size={20} strokeWidth={activeView === id ? 2.4 : 1.8} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
