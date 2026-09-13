# Architecture cible

Ce dépôt démarre par un prototype web/PWA local. L’objectif est de valider la navigation, le player universel et l’expérience de transcription synchronisée avant de brancher les services externes.

## Découpage recommandé

- `app/` : routes Next.js, navigation et écrans du produit.
- `components/player/` : mini-player, player plein écran, contrôles et file d’attente.
- `components/transcript/` : `TimedTranscript`, recherche, segment actif et liens temporels.
- `components/quran/` : adaptateur ayah/mot, traduction, tafsir et répétition.
- `lib/` : types de domaine, API clients et règles métier.
- `supabase/` : migrations, politiques RLS et fonctions serveur lorsque Supabase sera connecté.

## Principe du player

Tous les contenus sont adaptés vers un `PlaybackItem`. Le player publie un temps courant unique. `TimedTranscript` reçoit ce temps, trouve le segment actif et permet un seek en cliquant sur un passage. La partie Coran utilise le même contrat avec des métadonnées supplémentaires (`surah`, `ayah`, traduction et, plus tard, mots synchronisés).

## Séparation des contenus religieux

Le texte arabe canonique, les traductions, les tafsir, les transcriptions automatiques et les notes utilisateur doivent rester dans des modèles distincts. Aucun résultat généré par IA ne peut être présenté comme du texte coranique ou comme une citation vérifiée.

## Droits et publication

Tout média externe suit le workflow suivant :

`RIGHTS_UNKNOWN → RIGHTS_REVIEW → RIGHTS_APPROVED → PUBLISHED`

`RIGHTS_REJECTED` bloque définitivement la publication. L’enregistrement de licence conserve la source, l’auteur, le détenteur des droits, la licence, les autorisations commerciales et de modification, l’attribution, la date de vérification et le justificatif.

## Étapes techniques

1. Valider le prototype et le design system.
2. Ajouter Supabase Auth, PostgreSQL, Storage et RLS.
3. Connecter Quran Foundation après validation de ses conditions d’API et d’attribution.
4. Implémenter la progression, les favoris et la bibliothèque.
5. Ajouter l’ingestion contrôlée des contenus et le registre de licences.
6. Ajouter la transcription, l’indexation plein texte et les téléchargements autorisés.
