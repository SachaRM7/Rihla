# Modèle de données canonique — Phase 3

Ce document fixe le modèle métier avant le choix définitif du stockage. Les types exécutables vivent dans `lib/domain.ts`.

## Principes

1. Le texte coranique canonique n'est jamais dupliqué dans les contenus éditoriaux.
2. Une récitation référence un récitant, une source, des droits et un média.
3. Un contenu parlé peut posséder plusieurs médias (audio et vidéo).
4. Source, média, droits, transcription et artwork sont des objets distincts : leurs licences peuvent différer.
5. Les trois progressions `playback`, `Quran reading` et `Quran listening` restent séparées.
6. Favori et marque-page ne sont pas synonymes.
7. Les données utilisateur sont privées par défaut.
8. Aucun média ne devient publiable si ses droits nécessaires ne sont pas explicitement compatibles.

## Agrégats

### Catalogue
- Creator
- ContentItem
- Series
- Topic
- Collection
- MediaAsset

### Provenance
- SourceRef
- RightsRecord
- RightsCapabilities

### Coran
- QuranReference
- Recitation
- QuranReadingProgress
- QuranListeningProgress

Le texte, les traductions et le tafsir seront intégrés via des adaptateurs de sources autorisées plutôt que copiés dans `ContentItem`.

### Transcription
- Transcript
- TranscriptSegment
- MediaChapter

### Utilisateur
- Favorite
- Bookmark
- PrivateNote
- Playlist
- PlaybackProgress
- QuranReadingProgress
- QuranListeningProgress
- Follow
- UserPreference

## Identifiants

Tous les objets internes utilisent un identifiant opaque `string`. Les identifiants externes (Quran Foundation, YouTube, IslamHouse, etc.) sont stockés séparément avec leur source afin d'éviter de coupler le domaine à un fournisseur.

## Suppression

Les contenus éditoriaux utilisent principalement des états `UNAVAILABLE` / `ARCHIVED` afin de préserver provenance et historique. Les données personnelles restent supprimables réellement selon les commandes utilisateur.

## Dépendance suivante

Ce modèle suffit maintenant pour définir le **contrat du moteur de lecture** sans encore dépendre des écrans. La Phase 4 doit produire :
- PlaybackItem normalisé ;
- queue ;
- commandes par famille de contenu ;
- progression et reprise ;
- événements player ;
- erreurs/buffering ;
- règles de transition Coran ↔ contenu parlé.
