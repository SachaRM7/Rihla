# Tasks: MVP Coran fonctionnel et mobile

**Input**: Design documents from `/specs/001-functional-mobile-mvp/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Créer la structure `lib/quran/`, `app/api/quran/`, `components/` et `hooks/` prévue par plan.md
- [ ] T002 Vérifier les scripts existants et préserver la stack Next/Vinext sans nouvelle dépendance

## Phase 2: Foundational

- [ ] T003 [P] Définir les types de domaine et réponses API dans `lib/quran/types.ts`
- [ ] T004 [P] Définir l’allowlist de récitateurs, les sources et valeurs par défaut dans `lib/quran/constants.ts`
- [ ] T005 Implémenter l’adaptateur distant validé, timeout et erreurs dans `lib/quran/source.ts`
- [ ] T006 Implémenter `GET /api/quran/surahs` dans `app/api/quran/surahs/route.ts`
- [ ] T007 Implémenter `GET /api/quran/surah/[number]` dans `app/api/quran/surah/[number]/route.ts`

**Checkpoint**: Les données réelles et URL audio sont accessibles via les contrats internes.

## Phase 3: User Story 1 - Écouter une sourate réelle (P1) MVP

**Goal**: Catalogue réel, sélection et lecture audio réelle par ayah.

**Independent Test**: Sélectionner Al-Fatiha, lancer/pause/seek/précédent/suivant, puis vérifier l’auto-avance.

- [ ] T008 [US1] Implémenter le hook audio événementiel dans `hooks/use-quran-player.ts`
- [ ] T009 [P] [US1] Implémenter le catalogue et la recherche dans `components/surah-browser.tsx`
- [ ] T010 [P] [US1] Implémenter les contrôles réels dans `components/mini-player.tsx` et `components/full-player.tsx`
- [ ] T011 [US1] Brancher catalogue, chargement de sourate et player dans `components/app-shell.tsx` et `app/page.tsx`
- [ ] T012 [US1] Ajouter loading, retry et erreurs audio/réseau dans les composants du parcours

**Checkpoint**: La lecture n’utilise plus aucun timer simulé ni URL fictive.

## Phase 4: User Story 2 - Suivre le texte synchronisé (P1)

**Goal**: Texte arabe, traduction française et ayah active liés au lecteur.

**Independent Test**: Ouvrir le texte, vérifier la surbrillance et toucher une ayah pour la sélectionner.

- [ ] T013 [US2] Implémenter la liste d’ayat accessible et RTL dans `components/ayah-list.tsx`
- [ ] T014 [US2] Synchroniser sélection, auto-scroll et lecteur dans `components/app-shell.tsx`
- [ ] T015 [US2] Ajouter la provenance et les règles de distinction du texte dans `components/source-disclosure.tsx` et `app/layout.tsx`

**Checkpoint**: Audio, ayah active et traduction forment un parcours cohérent.

## Phase 5: User Story 3 - Reprise et favoris (P2)

**Goal**: Persister et restaurer la bibliothèque locale.

**Independent Test**: Ajouter des favoris, changer d’ayah, recharger et vérifier la restauration.

- [ ] T016 [US3] Implémenter le document local versionné et défensif dans `hooks/use-local-library.ts`
- [ ] T017 [US3] Brancher favoris sourate/ayah, reprise et récitant dans `components/app-shell.tsx`
- [ ] T018 [US3] Implémenter la vue Bibliothèque réelle et les états vides dans `components/app-shell.tsx`

**Checkpoint**: L’état utile survit à un rechargement quand localStorage est disponible.

## Phase 6: User Story 4 - Mobile-first (P1)

**Goal**: Usage d’une main de 320 à 430 px sans débordement.

**Independent Test**: Vérifier les quatre largeurs cibles, la navigation, le mini-player et les cibles tactiles.

- [ ] T019 [P] [US4] Implémenter la navigation persistante dans `components/mobile-navigation.tsx`
- [ ] T020 [US4] Recomposer l’interface mobile-first et desktop dans `app/globals.css`
- [ ] T021 [US4] Vérifier safe areas, targets 44 px, focus clavier, reduced motion et absence d’overflow

## Phase 7: Convergence et publication

- [ ] T022 Exécuter lint et build de production ; corriger toute régression
- [ ] T023 Vérifier les deux routes API et le parcours fonctionnel du quickstart
- [ ] T024 Vérifier visuellement les largeurs 320, 360, 390 et 430 px
- [ ] T025 Relire spec/plan/tasks contre l’implémentation et ajouter toute tâche manquante
- [ ] T026 Committer et pousser la branche main du dépôt situé sur D:
- [ ] T027 Publier une nouvelle version privée sur le site existant et vérifier l’URL hébergée

## Dependencies & Execution Order

- T001–T002 précèdent T003–T007.
- T003–T007 bloquent le player et l’interface.
- T008–T012 précèdent T013–T018.
- T019 peut commencer après le shell de T011 ; T020–T021 concluent la composition.
- T022–T027 ne commencent qu’après tous les checkpoints fonctionnels.

## Notes

- Aucune fonction non branchée ne reçoit de faux comportement.
- Aucun test automatisé supplémentaire n’est imposé par la spécification ; lint, build, contrats et parcours navigateur constituent la vérification proportionnée de cet incrément.
- Tous les fichiers, caches de projet et artefacts restent sous `D:\plateforme-islamique`.
