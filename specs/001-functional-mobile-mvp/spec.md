# Feature Specification: MVP Coran fonctionnel et mobile

**Feature Branch**: `main`  
**Created**: 2026-09-13  
**Status**: Ready  
**Input**: Transformer la maquette visuelle existante en première application réellement utilisable, centrée sur le Coran et adaptée aux mobiles.

## User Scenarios & Testing

### User Story 1 - Écouter une sourate réelle (Priority: P1)

En tant qu’utilisateur, je veux parcourir les 114 sourates, en choisir une et écouter une récitation réelle afin que le produit rende immédiatement son service principal.

**Why this priority**: Sans catalogue réel ni audio réel, le produit reste une maquette.

**Independent Test**: Ouvrir l’application, sélectionner Al-Fatiha, lancer la lecture, mettre en pause, avancer dans la piste et passer à l’ayah suivante.

**Acceptance Scenarios**:

1. **Given** la page d’accueil chargée, **When** l’utilisateur ouvre le catalogue Coran, **Then** les 114 sourates provenant de la source de données sont affichées.
2. **Given** une sourate sélectionnée, **When** l’utilisateur appuie sur lecture, **Then** le fichier audio réel de l’ayah courante démarre et la progression reflète le média.
3. **Given** une ayah en lecture, **When** elle se termine, **Then** l’ayah suivante démarre automatiquement si elle existe.
4. **Given** le lecteur ouvert, **When** l’utilisateur utilise précédent, suivant, pause ou la barre de progression, **Then** le média réagit immédiatement.

---

### User Story 2 - Suivre le texte synchronisé (Priority: P1)

En tant qu’utilisateur, je veux voir l’ayah arabe et sa traduction française pendant la récitation pour écouter et comprendre dans un même écran.

**Why this priority**: Le lien entre audio et texte est le différenciateur central du produit.

**Independent Test**: Lancer une sourate, ouvrir la vue Coran, vérifier la surbrillance de l’ayah active, puis toucher une autre ayah pour y accéder.

**Acceptance Scenarios**:

1. **Given** une sourate chargée, **When** une ayah est active, **Then** son texte arabe, sa traduction et sa référence sont visibles et mises en évidence.
2. **Given** la liste des ayat, **When** l’utilisateur touche une ayah, **Then** le lecteur sélectionne cette ayah et démarre ou se prépare au bon média.
3. **Given** l’interface en français, **When** le texte coranique s’affiche, **Then** l’arabe est rendu de droite à gauche sans modification automatique.

---

### User Story 3 - Retrouver sa progression et ses favoris (Priority: P2)

En tant qu’utilisateur, je veux retrouver la dernière sourate, la dernière ayah et mes favoris après avoir fermé l’application.

**Why this priority**: Une bibliothèque personnelle et une reprise fiable transforment une session ponctuelle en usage quotidien.

**Independent Test**: Lire une ayah, ajouter une sourate et une ayah aux favoris, recharger la page, puis vérifier la restauration.

**Acceptance Scenarios**:

1. **Given** une écoute en cours, **When** l’ayah change ou que la lecture progresse, **Then** l’état utile de reprise est enregistré sur l’appareil.
2. **Given** des favoris existants, **When** l’utilisateur recharge l’application, **Then** les favoris sont restaurés.
3. **Given** un stockage navigateur indisponible, **When** l’utilisateur utilise l’application, **Then** la lecture reste fonctionnelle sans provoquer de blocage.

---

### User Story 4 - Utiliser l’application d’une main sur mobile (Priority: P1)

En tant qu’utilisateur mobile, je veux naviguer et contrôler l’écoute sans zoom ni défilement horizontal.

**Why this priority**: Le mobile est le contexte principal d’écoute.

**Independent Test**: Vérifier l’accueil, la recherche, le catalogue, le player et la bibliothèque aux largeurs 320, 360, 390 et 430 px.

**Acceptance Scenarios**:

1. **Given** un écran de 320 à 430 px, **When** l’utilisateur navigue, **Then** aucun contenu essentiel ne déborde horizontalement.
2. **Given** un média chargé, **When** l’utilisateur change d’onglet, **Then** le mini-player et la navigation restent accessibles en bas de l’écran.
3. **Given** un usage tactile, **When** l’utilisateur vise une action principale, **Then** la cible tactile mesure au moins 44 px dans sa plus petite dimension.

## Edge Cases

- La source Coran est lente, indisponible ou renvoie des données incomplètes.
- Une URL audio échoue en cours de lecture.
- Le navigateur bloque la lecture automatique.
- L’utilisateur change rapidement de sourate ou d’ayah pendant un chargement.
- La sourate contient un grand nombre d’ayat.
- Le stockage local est plein, désactivé ou corrompu.
- Le texte arabe, les noms français longs et la traduction doivent cohabiter sans débordement.
- La lecture se poursuit pendant qu’une autre vue est affichée.
- Les podcasts, vidéos et conférences ne disposent pas encore de sources licenciées validées.

## Requirements

### Functional Requirements

- **FR-001**: Le système MUST charger un catalogue réel et complet de 114 sourates depuis une source externe documentée.
- **FR-002**: Le système MUST afficher des états distincts de chargement, succès, vide et erreur avec une action de nouvelle tentative.
- **FR-003**: L’utilisateur MUST pouvoir rechercher une sourate par numéro, nom arabe, nom français ou translittération.
- **FR-004**: L’utilisateur MUST pouvoir sélectionner une sourate et charger ses ayat.
- **FR-005**: Le lecteur MUST lire de vrais fichiers audio d’ayah et MUST refléter le temps réel du média sans progression simulée.
- **FR-006**: L’utilisateur MUST pouvoir lire, mettre en pause, seek, passer à l’ayah précédente et suivante.
- **FR-007**: Le lecteur MUST avancer automatiquement vers l’ayah suivante à la fin de la piste, sauf à la fin de la sourate.
- **FR-008**: L’utilisateur MUST pouvoir choisir parmi une liste validée de récitateurs disponibles.
- **FR-009**: Le système MUST afficher pour chaque ayah le texte arabe canonique fourni par la source, une traduction française, le numéro et l’état actif.
- **FR-010**: Toucher une ayah MUST sélectionner cette ayah dans le lecteur.
- **FR-011**: Le texte coranique MUST être protégé des traductions automatiques du navigateur et clairement distingué de la traduction.
- **FR-012**: L’utilisateur MUST pouvoir ajouter ou retirer une sourate et une ayah de ses favoris.
- **FR-013**: Le système MUST conserver localement la dernière sourate, la dernière ayah, le récitant et les favoris, puis les restaurer au chargement suivant.
- **FR-014**: L’application MUST afficher la provenance des données et des médias à deux interactions maximum du contenu.
- **FR-015**: Les catégories sans source licenciée branchée MUST être présentées comme indisponibles ou à venir et MUST NOT simuler de lecture.
- **FR-016**: L’interface MUST disposer d’une navigation mobile persistante et d’un mini-player utilisable entre 320 et 430 px.
- **FR-017**: Toutes les actions tactiles principales MUST avoir une cible d’au moins 44 × 44 px.
- **FR-018**: L’interface MUST être navigable au clavier, annoncer les contrôles de lecture et respecter la préférence de réduction des animations.

### Key Entities

- **SurahSummary**: Numéro, nom arabe, nom translittéré, nom traduit, type de révélation, nombre d’ayat.
- **AyahPlayback**: Numéro global, numéro dans la sourate, texte arabe, traduction française, URL audio.
- **Reciter**: Identifiant d’édition validé, nom affiché, langue et débit disponible.
- **PlaybackState**: Sourate active, ayah active, récitant, état de lecture, position, durée et erreur éventuelle.
- **LocalLibrary**: Sourates favorites, ayat favorites et état minimal de reprise.
- **SourceAttribution**: Nom de la source, URL, conditions d’utilisation et date d’accès logique.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Un nouvel utilisateur peut lancer une récitation réelle en trois interactions ou moins depuis l’accueil chargé.
- **SC-002**: Aucun défilement horizontal n’apparaît sur les vues principales aux largeurs 320, 360, 390 et 430 px.
- **SC-003**: Les contrôles lecture, pause, précédent, suivant et seek modifient le média réel lors d’un test de bout en bout.
- **SC-004**: Après rechargement, la dernière sourate, la dernière ayah, le récitant et les favoris sont restaurés dans 100 % des navigateurs où le stockage local est disponible.
- **SC-005**: En cas d’échec réseau ou audio, l’utilisateur voit un message compréhensible et une action utile en moins de cinq secondes.
- **SC-006**: La provenance des textes, traductions et fichiers audio est accessible en deux interactions maximum.
- **SC-007**: Les fonctions essentielles sont utilisables au clavier et les boutons du player possèdent des libellés accessibles.

## Assumptions

- Ce premier incrément fonctionnel se concentre sur le Coran ; les podcasts, vidéos et conférences restent visibles uniquement comme périmètre futur tant qu’aucun contenu licencié n’est branché.
- La progression et les favoris sont stockés sur l’appareil pour ce MVP ; l’authentification et la synchronisation Supabase viendront dans un incrément distinct.
- Une connexion Internet est requise pour charger les textes et diffuser l’audio.
- Les médias sont diffusés depuis leur source et ne sont pas republiés par l’application.
- L’interface est d’abord française, avec rendu RTL complet pour le texte arabe.
