# Implementation Plan: MVP Coran fonctionnel et mobile

**Branch**: `main` | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-functional-mobile-mvp/spec.md`

## Summary

Remplacer les données statiques et le chronomètre simulé de la maquette par un parcours Coran réellement fonctionnel. Le catalogue, les ayat, la traduction française et les URL audio sont servis par des routes serveur internes qui adaptent Al Quran Cloud. Le navigateur utilise un unique élément audio, une bibliothèque locale versionnée et une interface mobile-first. Les autres catégories restent explicitement non connectées.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.2, Next.js 16.2 avec runtime Vinext  
**Primary Dependencies**: Next.js App Router, React, lucide-react, CSS Tailwind/global existant  
**Storage**: localStorage versionné pour le MVP ; aucune donnée sensible  
**Testing**: ESLint, build de production, vérification des contrats API et parcours navigateur  
**Target Platform**: Web responsive, PWA-compatible, navigateurs mobiles modernes 320–430 px  
**Project Type**: Application web avec routes API serveur  
**Performance Goals**: premier contenu utile visible rapidement ; changements d’ayah réactifs ; une seule requête de sourate active  
**Constraints**: streaming distant, lecture soumise aux politiques autoplay, pas de clé Quran Foundation disponible, texte religieux non modifié  
**Scale/Scope**: 114 sourates, une vue principale, quatre onglets, un lecteur persistant, stockage local par appareil

## Constitution Check

La constitution fournie par Spec Kit n’est pas encore ratifiée et ne définit aucun gate projet. Les règles actives viennent des instructions du dépôt :

- Le dépôt et tous les artefacts restent sur `D:\plateforme-islamique`.
- Aucun outil ni cache nouveau n’est installé sur C:.
- Le changement préserve la stack existante et le déploiement Sites.
- Le périmètre livré ne simule aucune fonctionnalité non branchée.
- La validation couvre le build, le lint, les routes de données et le rendu mobile.

**Gate result before research**: PASS  
**Gate result after design**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-functional-mobile-mvp/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- quran-api.md
|   `-- ui-state.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
app/
|-- api/quran/
|   |-- surahs/route.ts
|   `-- surah/[number]/route.ts
|-- globals.css
|-- layout.tsx
`-- page.tsx
components/
|-- app-shell.tsx
|-- ayah-list.tsx
|-- full-player.tsx
|-- mini-player.tsx
|-- mobile-navigation.tsx
|-- surah-browser.tsx
`-- source-disclosure.tsx
hooks/
|-- use-local-library.ts
`-- use-quran-player.ts
lib/
`-- quran/
    |-- constants.ts
    |-- source.ts
    `-- types.ts
```

**Structure Decision**: Conserver l’application Next/Vinext mono-projet existante. Isoler l’adaptateur de source, les routes serveur, les hooks d’état et les composants d’interface sans ajouter de framework ni service externe supplémentaire.

## Phase 0: Research

Voir [research.md](./research.md). Les décisions structurantes sont :

1. Utiliser Al Quran Cloud pour un MVP public immédiat, car Quran Foundation exige désormais des identifiants OAuth serveur.
2. Diffuser les fichiers audio depuis la source sans les recopier.
3. Passer par des routes internes validées et une allowlist de récitateurs.
4. Stocker seulement la reprise et les favoris dans un document local versionné.
5. Traiter la lecture par ayah pour garantir l’auto-avance et la synchronisation d’état sans timestamps mot à mot.

## Phase 1: Design & Contracts

Voir [data-model.md](./data-model.md), [contracts/quran-api.md](./contracts/quran-api.md), [contracts/ui-state.md](./contracts/ui-state.md) et [quickstart.md](./quickstart.md).

## Complexity Tracking

Aucune violation à justifier. La solution utilise la stack existante et ne crée ni base de données ni service additionnel.
