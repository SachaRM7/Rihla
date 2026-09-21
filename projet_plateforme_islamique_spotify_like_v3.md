# Projet — Plateforme audio/vidéo islamique inspirée de Spotify — V3

> **Version 3 — document maître du projet RIHLA.**
>
> Cette version consolide la vision produit, l’architecture fonctionnelle, les règles de contenu, les droits, le Coran, le player universel, la recherche, la bibliothèque, l’offline, l’administration, la transcription, les recommandations et les fonctions avancées. Elle sert de référence générale au dépôt ; les specs détaillées du dossier `specs/` précisent ensuite les incréments déjà implémentés ou en cours.

## 1. Vision du produit

Créer une application mobile/web de consommation de contenu islamique avec une expérience fluide, moderne et familière, inspirée des meilleurs patterns de Spotify sans copier son identité de marque.

Le produit centralise notamment :

- Coran audio
- Récitations
- Sourates
- Tafsir
- Traductions
- Podcasts islamiques
- Conférences
- Interviews
- Séries audio
- Vidéos islamiques
- Contenus courts / rappels
- Playlists thématiques
- Favoris
- Historique d’écoute
- Téléchargements hors ligne
- Progression de lecture et d’écoute

L’objectif est d’offrir une expérience “Spotify du contenu islamique”, tout en développant une identité visuelle propre et des fonctions spécifiques à l’apprentissage, à l’écoute et à la compréhension du Coran.

---

# 2. Positionnement

## Proposition de valeur

Une seule application pour :

1. écouter le Coran ;
2. suivre le texte synchronisé avec la récitation ;
3. regarder ou écouter des contenus islamiques ;
4. afficher les transcriptions synchronisées des conférences, interviews et podcasts ;
5. reprendre un contenu exactement là où l’utilisateur s’est arrêté ;
6. sauvegarder des passages, versets, épisodes et playlists ;
7. rechercher un mot, un sujet, un verset ou une phrase dans les contenus ;
8. construire une bibliothèque personnelle.

---

# 3. Inspiration Spotify — ce qui peut être repris

L’application peut reprendre des **patterns UX génériques** de Spotify :

- navigation principale en onglets ;
- page d’accueil éditorialisée ;
- sections horizontales ;
- cartes de contenu ;
- mini-player persistant ;
- player plein écran ;
- file d’attente ;
- bibliothèque ;
- favoris ;
- historique ;
- playlists ;
- pages “artiste” ;
- pages “album/série” ;
- lecture continue ;
- bouton de transcription/paroles ;
- reprise de lecture ;
- recommandations ;
- téléchargements ;
- écoute hors ligne.

## À ne pas copier à l’identique

Ne pas faire un clone pixel-perfect de Spotify.

Éviter notamment :

- le logo Spotify ;
- le vert Spotify comme couleur d’identité principale ;
- leurs illustrations propriétaires ;
- leurs assets ;
- leurs icônes exactes ;
- leurs écrans copiés à l’identique ;
- leur typographie ou composition trop reconnaissable si elle est utilisée comme élément de marque.

Le but est :

> Familiarité UX + identité visuelle originale.

---

# 4. Identité visuelle proposée

## Direction

Interface sombre, premium, sobre et apaisante.

Exemple de palette :

- Background principal : noir profond / anthracite
- Surface : gris chaud très foncé
- Texte principal : ivoire / blanc cassé
- Texte secondaire : gris doux
- Accent principal : vert olive, émeraude sombre ou doré discret
- Accent secondaire : sable / beige chaud

## Principes

- priorité au contenu ;
- peu de texte visible à la fois ;
- informations détaillées accessibles à la demande ;
- hiérarchie très forte ;
- composants facilement scannables ;
- grand usage des covers ;
- animations discrètes ;
- interface très lisible sur mobile ;
- RTL correctement géré pour l’arabe.

---

# 5. Navigation principale

Proposition :

1. **Accueil**
2. **Recherche**
3. **Bibliothèque**
4. **Profil**

Le mini-player reste visible en permanence lorsque du contenu est en cours de lecture.

---

# 6. Accueil

L’accueil est personnalisé.

Exemples de sections :

- Reprendre l’écoute
- Continuer ma lecture du Coran
- Sourates récemment écoutées
- Récitations populaires
- Mes récitateurs
- Tafsir
- Podcasts recommandés
- Derniers épisodes
- Conférences récentes
- Vidéos populaires
- Séries à découvrir
- Rappels courts
- Pour dormir
- Pour apprendre
- Pour mémoriser
- Histoires des prophètes
- Famille
- Spiritualité
- Fiqh
- Sîra
- Coran et réflexion
- Nouveautés

---

# 7. Recherche

Recherche globale sur :

- Sourates
- Ayat
- Traductions
- Récitateurs
- Tafsir
- Podcasts
- Épisodes
- Conférences
- Séries
- Chaînes
- Intervenants
- Sujets
- Mots-clés
- Transcriptions

## Recherche dans la transcription

Exemple :

Utilisateur cherche :

> patience

Résultats possibles :

- versets contenant le mot dans la traduction ;
- épisodes de podcast mentionnant le sujet ;
- conférences contenant le mot ;
- timestamps exacts.

Exemple :

> 18:42 — “La patience fait partie…”

Un clic doit ouvrir directement le contenu au bon timestamp.

---

# 8. Bibliothèque

Sections :

- Favoris
- Playlists
- Sourates sauvegardées
- Ayat sauvegardées
- Podcasts suivis
- Séries suivies
- Vidéos sauvegardées
- Téléchargements
- Historique
- À écouter plus tard
- Passages enregistrés

Filtres :

- audio ;
- vidéo ;
- Coran ;
- podcast ;
- conférence ;
- favoris ;
- téléchargé.

---

# 9. Partie Coran

## Source recommandée

Quran Foundation / Quran.com API.

Elle peut fournir selon les endpoints et ressources disponibles :

- texte arabe ;
- chapitres ;
- ayat ;
- traductions ;
- tafsir ;
- récitateurs ;
- fichiers audio ;
- métadonnées ;
- timestamps ;
- segments synchronisés pour certaines récitations.

L’intégration doit respecter leurs conditions d’utilisation, limites d’API, règles de crédit et de stockage.

---

# 10. Player Coran

## Player principal

Éléments :

- nom de la sourate ;
- récitant ;
- artwork ;
- bouton play/pause ;
- précédent / suivant ;
- barre de progression ;
- vitesse ;
- répétition ;
- timer ;
- file d’attente ;
- téléchargement ;
- favoris ;
- partage ;
- bouton “Afficher le Coran”.

## Afficher le Coran

Équivalent fonctionnel du bouton “Afficher les paroles”.

Le panneau affiche :

- texte arabe ;
- ayah actuelle ;
- traduction ;
- translittération optionnelle ;
- numéro de verset ;
- défilement automatique ;
- surbrillance synchronisée.

Modes possibles :

- par ayah ;
- mot par mot.

---

# 11. Synchronisation Coran

## Niveau 1 — Ayah

Chaque verset possède :

- start time ;
- end time.

Pendant la récitation, l’ayah active est mise en évidence.

## Niveau 2 — Mot par mot

Lorsque disponible :

```json
[
  {
    "word": "اللَّهِ",
    "start": 850,
    "end": 1720
  }
]
```

Le player utilise `currentTime` pour :

- identifier le mot actif ;
- mettre le mot en évidence ;
- faire défiler automatiquement ;
- resynchroniser immédiatement après un seek.

---

# 12. Fonctions Coran avancées

- reprise à la dernière ayah ;
- favoris ;
- marque-pages ;
- notes personnelles ;
- répétition d’un verset ;
- répétition d’une plage d’ayat ;
- répétition 3x / 5x / 10x ;
- vitesse de lecture ;
- minuterie ;
- choix récitant ;
- choix traduction ;
- choix translittération ;
- choix tafsir ;
- télécharger une sourate ;
- mode hors ligne ;
- progression par sourate ;
- progression par Juz ;
- suivi de khatma ;
- mémorisation ;
- boucle A-B ;
- lecture verset par verset ;
- partage d’un verset ;
- deep link vers un ayah ;
- historique Coran ;
- mode nuit ;
- mode lecture seule.

---

# 13. Podcasts, interviews et conférences

Chaque contenu peut avoir :

- titre ;
- intervenant ;
- série ;
- thème ;
- miniature ;
- audio ;
- vidéo ;
- durée ;
- description ;
- chapitres ;
- transcription ;
- timestamps ;
- source ;
- langue ;
- tags.

---

# 14. Transcription synchronisée

Même composant générique pour :

- podcast ;
- interview ;
- conférence ;
- vidéo ;
- sermon ;
- cours.

Structure conseillée :

```ts
type TranscriptSegment = {
  id: string
  start: number
  end: number
  text: string
}
```

Exemple :

```json
[
  {
    "start": 72.4,
    "end": 76.1,
    "text": "La patience est une qualité essentielle."
  },
  {
    "start": 76.1,
    "end": 80.8,
    "text": "Elle prend toute son importance dans les moments d’épreuve."
  }
]
```

---

# 15. Composant universel TimedTranscript

Créer un composant réutilisable :

`<TimedTranscript />`

Responsabilités :

- recevoir la transcription ;
- suivre le temps du player ;
- identifier le segment actif ;
- surligner la phrase active ;
- autoscroll ;
- clic sur une phrase → seek audio/vidéo ;
- recherche dans la transcription ;
- copie d’un passage ;
- partage du timestamp ;
- éventuellement traduction.

Ce composant peut être partagé avec la partie Coran en utilisant un adaptateur.

---

# 16. YouTube

## Ce que permet l’API officielle

YouTube Data API permet notamment :

- récupérer les métadonnées d’une vidéo ;
- rechercher des vidéos ;
- récupérer les informations de chaîne ;
- afficher miniatures et informations publiques ;
- gérer certaines données de sous-titres pour les contenus autorisés.

## Limite importante

L’API officielle YouTube ne fournit pas librement la transcription complète de n’importe quelle vidéo publique.

Le téléchargement de pistes de sous-titres via l’API nécessite des droits / authentification adaptés.

Donc :

### Vidéo possédée par la plateforme

Possible :

- récupérer ou générer la transcription ;
- stocker la transcription ;
- synchroniser précisément.

### Vidéo tierce YouTube

Ne pas dépendre d’un scraping fragile de la transcription YouTube.

Prévoir plusieurs stratégies légales :

1. contenu fourni directement par le créateur ;
2. partenariat avec la chaîne ;
3. fichier transcript fourni par l’auteur ;
4. génération interne de transcription si les droits le permettent ;
5. intégration YouTube uniquement en lecture sans transcript propriétaire si nécessaire.

---

# 17. Génération interne de transcription

Pour les contenus que la plateforme est autorisée à traiter :

Pipeline :

```text
Audio / Vidéo
      ↓
Speech-to-text
      ↓
Segmentation
      ↓
Timestamps
      ↓
Nettoyage
      ↓
Base de données
      ↓
TimedTranscript
```

Technologies possibles :

- OpenAI Speech-to-Text / Whisper ;
- Deepgram ;
- AssemblyAI ;
- Google Speech-to-Text ;
- modèle self-hosted.

Le choix pourra dépendre :

- coût ;
- précision arabe/français ;
- diarisation ;
- timestamps ;
- temps de traitement.

---

# 18. Fonctionnalités autour des transcriptions

À moyen terme :

- cliquer sur une phrase pour aller au timestamp ;
- recherche plein texte ;
- partage d’un passage ;
- créer un marque-page à un timestamp ;
- notes privées ;
- surlignage ;
- résumé automatique ;
- chapitrage automatique ;
- traduction ;
- extraction des citations ;
- sujets abordés ;
- liens vers les versets cités ;
- recommandations de contenus liés.

---

# 19. Page récitant / intervenant

Équivalent conceptuel d’une page artiste.

Contenu :

- photo ;
- nom ;
- biographie courte ;
- vérification ;
- abonnés/follow ;
- contenus populaires ;
- récitations ;
- séries ;
- podcasts ;
- conférences ;
- vidéos ;
- playlists ;
- nouveautés.

---

# 20. Séries

Équivalent fonctionnel d’un album ou podcast.

Exemples :

- Tafsir d’Al-Baqara
- Les histoires des prophètes
- Sîra
- Les noms d’Allah
- Ramadan
- Mariage
- Éducation des enfants

Une série contient :

- cover ;
- titre ;
- description ;
- auteur ;
- épisodes ;
- progression ;
- téléchargement ;
- suivi.

---

# 21. Playlists

Deux types :

## Playlists éditoriales

Créées par la plateforme.

Exemples :

- Pour dormir
- Matin
- Avant le travail
- Rappels courts
- Tafsir pour débutants
- 20 minutes de rappel

## Playlists personnelles

Créées par l’utilisateur.

Contenus mixtes possibles :

- sourates ;
- ayat ;
- podcasts ;
- épisodes ;
- conférences ;
- extraits.

---

# 22. Mini-player

Visible au bas de l’écran.

Contenu :

- artwork ;
- titre ;
- sous-titre ;
- play/pause ;
- progression ;
- éventuellement bouton like.

Un tap ouvre le player plein écran.

---

# 23. Player universel

Le player doit fonctionner avec plusieurs types :

```ts
type MediaType =
  | "quran"
  | "podcast"
  | "video"
  | "lecture"
  | "series"
```

API interne uniforme :

```ts
type PlaybackItem = {
  id: string
  type: MediaType
  title: string
  subtitle?: string
  artwork?: string
  sourceUrl: string
  duration?: number
}
```

---

# 24. File d’attente

Fonctions :

- prochain contenu ;
- réorganiser ;
- retirer ;
- lire ensuite ;
- ajouter à la queue ;
- lecture automatique ;
- recommandations en fin de contenu.

---

# 25. Téléchargements

Permettre lorsque les droits le permettent :

- sourate ;
- récitation ;
- épisode ;
- conférence ;
- playlist.

Stockage local chiffré ou protégé si nécessaire.

Prévoir gestion :

- espace utilisé ;
- qualité audio ;
- suppression automatique ;
- téléchargement Wi-Fi uniquement.

---

# 26. Profils utilisateur

Données principales :

- nom ;
- avatar ;
- langue ;
- préférences ;
- récitateurs suivis ;
- podcasts suivis ;
- historique ;
- playlists ;
- favoris ;
- progression Coran ;
- téléchargements ;
- paramètres audio.

---

# 27. Authentification

Options :

- email / mot de passe ;
- magic link ;
- Google ;
- Apple.

Supabase Auth convient très bien à ce type de projet.

---

# 28. Architecture technique proposée

## Frontend

Option recommandée :

- Next.js pour web / PWA ;
- React Native / Expo pour mobile natif si nécessaire.

Alternative :

- Flutter.

## Backend

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Edge Functions
- Realtime si nécessaire

## APIs externes

- Quran Foundation API
- YouTube Data API
- service de transcription
- éventuellement CDN média

---

# 29. Architecture logique

```text
Mobile / Web App
       |
       v
API / Backend
       |
       +--------------------+
       |                    |
       v                    v
Supabase              Quran Foundation
       |
       +-------------+
       |             |
       v             v
Transcripts      Media Metadata
       |
       v
Search Index
```

---

# 30. Modèle de données simplifié

## users

```text
id
display_name
avatar_url
language
created_at
```

## creators

```text
id
name
slug
bio
avatar_url
type
verified
```

## media_items

```text
id
type
title
description
creator_id
duration
audio_url
video_url
artwork_url
language
published_at
source
source_id
```

## series

```text
id
title
description
creator_id
artwork_url
```

## series_items

```text
series_id
media_id
position
```

## transcript_segments

```text
id
media_id
start_ms
end_ms
text
language
position
```

## favorites

```text
user_id
entity_type
entity_id
created_at
```

## listening_progress

```text
user_id
media_id
position_ms
completed
updated_at
```

## playlists

```text
id
user_id
title
description
visibility
created_at
```

## playlist_items

```text
playlist_id
entity_type
entity_id
position
```

## quran_bookmarks

```text
user_id
surah
ayah
note
created_at
```

---

# 31. Recherche

Pour commencer :

PostgreSQL Full Text Search.

Plus tard :

- Meilisearch ;
- Typesense ;
- Algolia ;
- Elasticsearch/OpenSearch.

Index :

- titres ;
- descriptions ;
- intervenants ;
- tags ;
- transcripts ;
- traductions ;
- thèmes.

---

# 32. Recommandations

MVP :

- règles simples ;
- contenu récent ;
- contenu populaire ;
- contenu similaire par tags ;
- repris récemment ;
- créateurs suivis.

Plus tard :

- embeddings ;
- recommandations personnalisées ;
- historique ;
- durée préférée ;
- thèmes préférés ;
- langue ;
- type de contenu.

---

# 33. Modération / fiabilité

Sujet particulièrement important pour une application religieuse.

Prévoir :

- provenance visible ;
- nom de l’intervenant ;
- source originale ;
- lien source ;
- statut de validation ;
- contenus signalables ;
- workflow éditorial ;
- correction de transcription ;
- distinction claire entre :
  - Coran
  - traduction
  - tafsir
  - contenu humain
  - transcription automatique.

Ne jamais présenter une transcription automatique comme une citation certaine sans possibilité de vérifier la source.

---

# 34. Gestion des textes religieux

Le texte coranique ne doit pas être modifié arbitrairement.

Séparer dans la base :

- texte arabe canonique ;
- traduction ;
- translittération ;
- tafsir ;
- notes utilisateur ;
- résumé généré.

Les contenus générés par IA ne doivent jamais être confondus avec le texte sacré.

---

# 35. Internationalisation

Prévoir dès le départ :

- français ;
- arabe ;
- anglais.

Support complet RTL pour l’arabe.

Le système doit pouvoir accueillir ensuite :

- espagnol ;
- allemand ;
- turc ;
- urdu ;
- indonésien ;
- etc.

---

# 36. Accessibilité

- VoiceOver / TalkBack ;
- contraste suffisant ;
- taille de texte dynamique ;
- navigation clavier ;
- boutons accessibles ;
- transcription disponible pour l’audio ;
- sous-titres pour vidéo ;
- langue déclarée correctement.

---

# 37. Notifications

Exemples :

- nouvel épisode d’un créateur suivi ;
- nouvelle série ;
- rappel de reprise ;
- contenu téléchargé ;
- nouvelle récitation ;
- contenu ajouté à une playlist.

Éviter les notifications religieuses intrusives ou culpabilisantes.

---

# 38. Analytics

Mesurer :

- démarrage de lecture ;
- durée écoutée ;
- completion rate ;
- reprise ;
- recherches ;
- ajouts favoris ;
- follow ;
- downloads ;
- ouverture transcription ;
- clic transcription → seek ;
- rétention ;
- contenu partagé.

---

# 39. Monétisation possible

Sans être obligatoire pour le MVP :

## Freemium

Gratuit :

- Coran ;
- écoute standard ;
- podcasts ;
- transcription basique.

Premium :

- offline avancé ;
- meilleure qualité audio ;
- playlists illimitées ;
- notes ;
- outils mémorisation ;
- fonctions avancées de transcription ;
- personnalisation.

Autres possibilités :

- dons ;
- sponsoring contrôlé ;
- abonnement soutien ;
- partenariats créateurs.

Attention aux licences des contenus et aux conditions d’utilisation des APIs.

---

# 40. MVP recommandé

Le MVP doit rester concentré.

## MVP 1

### Coran

- liste des sourates ;
- lecteur audio ;
- récitant ;
- texte arabe ;
- traduction ;
- progression ;
- favoris ;
- reprise ;
- transcription/synchronisation ayah.

### Audio/vidéo

- catalogue ;
- recherche ;
- player ;
- mini-player ;
- pages créateurs ;
- séries ;
- favoris ;
- historique.

### Compte

- auth ;
- bibliothèque ;
- progression.

---

# 41. MVP 2

Ajouter :

- transcription synchronisée podcasts/conférences ;
- recherche dans les transcriptions ;
- téléchargement ;
- playlists ;
- suivis ;
- notifications ;
- chapitres.

---

# 42. V2

- mot par mot Coran ;
- mémorisation ;
- répétition A-B ;
- notes ;
- partage de passages ;
- recherche avancée ;
- suggestions personnalisées ;
- PWA/offline avancé.

---

# 43. V3

- recommandations intelligentes ;
- traduction de podcasts ;
- chapitrage automatique ;
- résumés ;
- citations ;
- extraction de versets cités ;
- recherche sémantique ;
- collections collaboratives ;
- outils créateurs.

---

# 44. Expérience idéale

Exemple :

1. utilisateur ouvre l’app ;
2. voit “Continuer Al-Baqara — 27:43” ;
3. lance la récitation ;
4. ouvre “Afficher le Coran” ;
5. le verset actif se synchronise ;
6. il sauvegarde l’ayah ;
7. finit la sourate ;
8. passe sur une conférence ;
9. ouvre “Transcription” ;
10. clique sur une phrase ;
11. le player saute automatiquement à 18:42 ;
12. il sauvegarde ce passage ;
13. l’app recommande une autre conférence sur le même thème.

---

# 45. Écrans principaux

Liste initiale :

1. Splash
2. Onboarding
3. Auth
4. Accueil
5. Recherche
6. Résultats
7. Bibliothèque
8. Playlist
9. Série
10. Créateur
11. Récitant
12. Sourate
13. Player Coran
14. Texte synchronisé
15. Player podcast
16. Player vidéo
17. Transcription
18. File d’attente
19. Téléchargements
20. Historique
21. Favoris
22. Paramètres
23. Profil
24. Langue
25. Qualité audio
26. Préférences Coran

---

# 46. Design system — composants

## Navigation

- BottomNavigation
- TopBar
- BackButton
- Tabs
- SegmentedControl

## Cards

- MediaCard
- EpisodeCard
- SurahCard
- CreatorCard
- PlaylistCard
- ContinueListeningCard
- HorizontalRail

## Player

- MiniPlayer
- FullPlayer
- ProgressBar
- PlaybackControls
- SpeedControl
- SleepTimer
- QueueButton
- TranscriptButton
- DownloadButton

## Quran

- AyahRow
- WordHighlight
- TranslationBlock
- TafsirPanel
- ReciterSelector
- RepeatControl
- QuranProgress

## Transcript

- TranscriptPanel
- TranscriptSegment
- SearchTranscript
- ActiveSegment
- TimestampLink

---

# 47. Principes UX

- ne jamais montrer trop de texte d’un coup ;
- privilégier la lecture rapide ;
- progressive disclosure ;
- conserver le contexte de lecture ;
- éviter les modales inutiles ;
- player toujours accessible ;
- transition fluide entre audio, vidéo et texte ;
- action principale visible ;
- recherche omniprésente.

---

# 48. Performance

Priorités :

- démarrage audio rapide ;
- préchargement ;
- cache des métadonnées ;
- image CDN ;
- lazy loading ;
- virtualisation des longues transcriptions ;
- indexation côté serveur ;
- stockage local de la progression.

---

# 49. Sécurité

- RLS Supabase ;
- ne jamais exposer de clés privées ;
- secrets uniquement serveur ;
- URL signées si nécessaire ;
- validation des contenus ;
- rate limiting ;
- protection des endpoints ;
- OAuth sécurisé.

---

# 50. Contraintes légales importantes

## Spotify

S’inspirer des patterns UX génériques, pas de leur identité de marque.

## YouTube

Respecter :

- YouTube Terms of Service ;
- limitations de l’API ;
- droits des créateurs ;
- restrictions sur le téléchargement ;
- restrictions de traitement des vidéos tierces.

## Quran Foundation

Respecter :

- attribution ;
- conditions développeur ;
- limites ;
- politique de stockage ;
- licences associées aux récitations / traductions.

## Podcasts et conférences

Chaque contenu doit avoir :

- droit de diffusion ;
- licence ;
- autorisation ;
- ou source autorisant explicitement l’intégration.

---

# 51. Décision produit centrale

Le cœur du produit n’est pas seulement :

> “Spotify mais islamique”.

Le différenciateur doit devenir :

> “Une plateforme de contenu islamique où audio, vidéo, Coran et texte sont reliés.”

Le contenu devient :

- écoutable ;
- lisible ;
- searchable ;
- cliquable ;
- partageable ;
- sauvegardable ;
- synchronisé.

---

# 52. Feature phare

## Universal Transcript Experience

Un seul paradigme UX :

### Coran

**Afficher le Coran**

→ ayah active  
→ mot actif  
→ traduction  
→ tafsir

### Podcast

**Afficher la transcription**

→ phrase active  
→ clic → timestamp

### Vidéo

**Afficher la transcription**

→ texte synchronisé  
→ clic → timestamp

La même logique visuelle crée une expérience cohérente dans toute l’application.

---

# 53. Priorité recommandée de développement

Ordre :

1. identité visuelle ;
2. navigation ;
3. catalogue ;
4. mini-player ;
5. player universel ;
6. Quran API ;
7. synchronisation ayah ;
8. auth ;
9. bibliothèque ;
10. favoris/progression ;
11. podcasts/conférences ;
12. transcription ;
13. recherche ;
14. téléchargement ;
15. personnalisation ;
16. fonctions IA.

---

# 54. Stack proposée

Version réaliste pour démarrer rapidement :

```text
Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui ou composants maison

Backend
- Supabase
- PostgreSQL
- Auth
- Storage
- Edge Functions

Coran
- Quran Foundation API

Vidéo
- YouTube Data API

Transcription
- OpenAI / Whisper ou autre moteur STT

Recherche
- PostgreSQL FTS au début
- Meilisearch / Typesense ensuite

Hosting
- Vercel
```

Pour une app mobile native plus tard :

```text
Expo / React Native
```

avec réutilisation d’une partie de la logique TypeScript.

---

# 55. Nom du projet

Nom à définir.

Critères :

- facile à prononcer ;
- pas trop générique ;
- identité propre ;
- internationalisable ;
- pas de référence trompeuse à Spotify ;
- domaine disponible ;
- stores disponibles.

---

# 56. Résumé final

Le projet vise une plateforme moderne pour le contenu islamique avec :

- UX inspirée de Spotify ;
- identité originale ;
- Coran audio ;
- texte synchronisé ;
- mot par mot possible ;
- podcasts ;
- interviews ;
- conférences ;
- vidéos ;
- transcription synchronisée ;
- recherche dans le contenu ;
- bibliothèque personnelle ;
- favoris ;
- playlists ;
- téléchargements ;
- historique ;
- reprise de lecture ;
- recommandations ;
- outils spécifiques Coran.

Le composant stratégique du produit est le couple :

**Player universel + TimedTranscript**

qui permet de traiter de manière cohérente :

- récitations ;
- podcasts ;
- interviews ;
- conférences ;
- vidéos.

Le Coran bénéficie en plus de fonctions dédiées :

- ayah ;
- mot ;
- traduction ;
- tafsir ;
- répétition ;
- mémorisation ;
- khatma ;
- marque-pages.

Le résultat recherché :

> une expérience de consommation de contenu islamique aussi fluide qu’une grande plateforme audio, mais conçue dès le départ autour du Coran, de la compréhension, de la recherche et de la transmission.


---

# 57. Banques de contenus principales

Pour constituer rapidement le catalogue initial de contenus islamiques francophones, privilégier les bibliothèques disposant de contenus réutilisables avec une licence claire.

## Priorité absolue — contenus Creative Commons

Rechercher en priorité des conférences, cours, rappels, interviews, podcasts et autres médias sous licences :

### CC0

**Priorité maximale.**

- réutilisation très libre ;
- adaptation possible ;
- usage commercial possible ;
- attribution généralement non obligatoire, même si créditer la source reste une bonne pratique.

### CC BY

**Priorité maximale.**

- réutilisation autorisée ;
- adaptation autorisée ;
- usage commercial autorisé ;
- attribution de l’auteur/source obligatoire.

### CC BY-SA

**Compatible, mais à examiner avant import.**

- réutilisation autorisée ;
- usage commercial autorisé ;
- attribution obligatoire ;
- obligation de partage sous licence compatible pour certaines adaptations.

### CC BY-NC

**À éviter par défaut pour le catalogue principal si l’application peut être monétisée.**

La clause NC limite l’utilisation aux usages non commerciaux.

### CC BY-ND

**À traiter avec prudence.**

La clause ND interdit de distribuer des versions adaptées. Cela peut notamment poser question si le contenu est modifié, traduit, remonté ou transformé.

## Règle fondamentale

Un contenu accessible gratuitement sur Internet n’est pas automatiquement librement réutilisable.

Toujours distinguer :

```text
Gratuit à consulter ≠ libre à republier
```

Avant tout import, enregistrer :

- auteur ;
- détenteur des droits si différent ;
- source originale ;
- URL source ;
- licence ;
- version de la licence ;
- obligations d’attribution ;
- autorisation commerciale ;
- autorisation de modification ;
- date de vérification.

---

# 58. IslamHouse — banque principale à auditer

**IslamHouse doit être considérée comme l’une des premières banques à explorer pour amorcer le catalogue francophone.**

Contenus potentiellement disponibles :

- audios ;
- vidéos ;
- conférences ;
- cours ;
- rappels ;
- khutbas ;
- séries ;
- Sîra ;
- croyance ;
- fiqh ;
- comportement ;
- famille ;
- jeunesse ;
- contenus éducatifs.

Le catalogue francophone est suffisamment important pour potentiellement fournir une quantité significative de contenu dès le lancement.

## Important

Ne pas considérer automatiquement l’ensemble d’IslamHouse comme libre de republication.

La licence et les conditions doivent être vérifiées :

- au niveau du contenu ;
- du fichier audio/vidéo ;
- de l’auteur ;
- de la collection concernée.

Si les conditions sont ambiguës, demander une autorisation globale à IslamHouse avant ingestion.

### Objectif

Obtenir idéalement une autorisation permettant :

```text
Import → hébergement ou streaming autorisé → métadonnées →
transcription → timestamps → chapitrage → recherche
```

avec attribution systématique.

---

# 59. La Voie Droite — partenaire potentiel prioritaire

**La Voie Droite / Islam Audio** constitue une autre source francophone particulièrement intéressante.

Son catalogue est directement aligné avec le produit :

- cours islamiques en français ;
- Coran ;
- tafsir ;
- fiqh ;
- conférences ;
- contenus audio ;
- classement par thèmes et intervenants.

Cependant :

```text
Application gratuite ≠ contenu librement réutilisable
```

La stratégie recommandée est donc de contacter directement l’équipe afin d’obtenir une autorisation de référencement et/ou de diffusion.

## Proposition de partenariat

Demander l’autorisation de :

- référencer leur catalogue ;
- afficher leurs métadonnées ;
- diffuser leurs contenus ;
- afficher clairement la source ;
- créditer chaque conférencier ;
- ajouter des transcriptions ;
- ajouter des timestamps ;
- rendre les contenus recherchables ;
- renvoyer vers leur plateforme/source.

Un partenariat pourrait permettre de récupérer rapidement un catalogue francophone déjà structuré.

---

# 60. Internet Archive — banque secondaire sous filtre de licence

Internet Archive peut servir de source complémentaire.

Ne jamais importer automatiquement l’ensemble des résultats.

Créer un filtre permettant uniquement les contenus dont les droits sont compatibles avec le projet.

Priorité :

```text
CC0
CC BY
CC BY-SA (après vérification)
Public Domain
```

Écarter automatiquement ou placer en revue manuelle :

```text
Licence inconnue
All Rights Reserved
CC BY-NC
CC BY-ND
Droits ambigus
```

Internet Archive peut notamment servir à retrouver :

- anciennes conférences ;
- cours audio ;
- séries ;
- archives ;
- contenus devenus difficiles à trouver ailleurs.

---

# 61. YouTube Creative Commons — source de découverte

YouTube peut servir à identifier des contenus islamiques francophones publiés avec une licence Creative Commons.

Cependant, la présence d’une licence CC ne dispense pas de respecter :

- les conditions YouTube ;
- les droits du créateur ;
- les éventuels droits de tiers présents dans la vidéo ;
- les conditions précises de la licence.

YouTube doit donc principalement servir comme :

```text
Découverte → vérification de la licence → identification du créateur →
contact/validation si nécessaire → intégration
```

et non comme une banque à aspirer automatiquement.

---

# 62. Wikimedia Commons — source libre complémentaire

Wikimedia Commons peut fournir des médias dont les licences sont clairement indiquées.

Probablement moins intéressant pour les longs cours islamiques francophones, mais utile pour :

- médias historiques ;
- illustrations ;
- photographies ;
- certains fichiers audio/vidéo ;
- éléments éditoriaux.

Chaque asset doit conserver ses informations d’attribution et de licence.

---

# 63. QuranEnc — complément Coran francophone

QuranEnc constitue une source complémentaire intéressante pour les traductions et ressources liées au Coran.

Peut compléter Quran Foundation pour certaines ressources françaises.

Conserver strictement :

- source ;
- traduction utilisée ;
- version ;
- attribution ;
- conditions de redistribution.

Ne jamais modifier silencieusement une traduction publiée par une source externe.

---

# 64. Registre des licences

Créer dès le départ une table dédiée.

## content_licenses

```text
id
media_id
source_name
source_url
author
rights_holder
license_type
license_version
commercial_use_allowed
derivatives_allowed
redistribution_allowed
attribution_required
attribution_text
verified_at
verification_url
permission_document
notes
```

Aucun contenu externe ne doit pouvoir passer en statut `published` si son statut de droits n’est pas défini.

Exemple :

```text
RIGHTS_UNKNOWN
      ↓
RIGHTS_REVIEW
      ↓
RIGHTS_APPROVED
      ↓
PUBLISHED
```

ou :

```text
RIGHTS_REJECTED
```

---

# 65. Ordre de priorité pour constituer le catalogue

Priorité recommandée :

1. **CC0 francophone**
2. **CC BY francophone**
3. **IslamHouse après vérification/autorisation**
4. **Partenariat La Voie Droite**
5. **CC BY-SA compatible**
6. **Internet Archive avec licence vérifiée**
7. **Créateurs francophones partenaires**
8. **YouTube comme outil de découverte**
9. **Autres contenus après autorisation individuelle**

Objectif : disposer rapidement d’un catalogue important **sans construire une dette juridique dès le lancement**.


---

# 66. Principes UX de densité et hiérarchie

L’interface doit privilégier l’accès immédiat au contenu plutôt que la présentation marketing de l’application.

## Règles

- réduire les grands titres ;
- réduire les textes d’introduction ;
- faire apparaître les contenus et boutons d’écoute dès le premier écran ;
- transformer l’accueil en page d’écoute, et non en landing page ;
- utiliser des compositions plus variées pour éviter une succession de gros rectangles ;
- maintenir une identité sombre, ivoire et olive ;
- augmenter le contraste des textes secondaires ;
- préserver des marges suffisantes autour du contenu pour que header, mini-player et navigation ne recouvrent jamais les éléments interactifs.

Supprimer les formulations internes ou techniques visibles par l’utilisateur, par exemple :

- « recherche réelle » ;
- « récitation réelle » ;
- « aucun faux contenu » ;
- « prochaine étape ».

Les catégories ne doivent apparaître que lorsqu’elles contiennent réellement du contenu.

---

# 67. Accueil centré sur l’écoute

L’accueil doit immédiatement proposer :

- reprise d’écoute ;
- reprise du Coran ;
- accès rapides ;
- récitations ;
- quelques découvertes ;
- contenus suivis ;
- sélections éditoriales utiles.

Éviter les grands blocs de présentation de l’application.

## Carte de sourate principale

La grande carte de sourate doit rester compacte et afficher directement :

- nom de la sourate ;
- nom arabe ;
- récitant ;
- progression éventuelle ;
- bouton d’écoute.

---

# 68. Navigation et en-tête

- remplacer le cœur chiffré de l’en-tête par un accès aux réglages ;
- rassembler les favoris dans la Bibliothèque ;
- utiliser une icône de collection pour Bibliothèque ;
- déplacer les réglages de lecture et d’apparence dans un écran dédié ;
- maintenir Bibliothèque centrée sur les contenus personnels.

---

# 69. Thèmes visuels

Prévoir :

- thème sombre ;
- thème clair ;
- mode automatique jour/nuit ;
- couleur d’accent indépendante du thème.

Le thème général ne doit jamais modifier la signification des codes couleur liés au tajwid ou à des informations pédagogiques.

---

# 70. Recherche — structure UX

Le champ de recherche doit être placé tout en haut de l’écran Recherche.

Ne pas imposer :

- grand titre ;
- paragraphe introductif ;
- bloc décoratif avant la recherche.

## Rôle des onglets

- **Coran** = point d’entrée pour parcourir sourates, ayat, juz et hizb ;
- **Recherche** = recherche transversale dans l’ensemble des contenus.

---

# 71. Recherche intelligente

La recherche doit être tolérante :

- aux accents ;
- aux fautes courantes ;
- aux variantes orthographiques ;
- aux translittérations ;
- aux différentes écritures latines des noms arabes.

Exemples :

```text
Mishary
Mishari
Mishary Alafasy
Al Afasy
Al-Afasy
```

doivent pouvoir converger vers la même entité.

---

# 72. Filtres contextuels de recherche

Filtres possibles :

- type de contenu ;
- langue ;
- durée ;
- récitant ;
- intervenant.

Ne montrer que les filtres réellement pertinents pour les résultats présents.

---

# 73. Résultats de recherche enrichis

Chaque résultat doit expliquer immédiatement pourquoi il apparaît.

Afficher lorsque pertinent :

- extrait de transcription ;
- verset correspondant ;
- traduction correspondante ;
- occurrence dans une conférence ;
- timestamp ;
- nom du créateur ;
- durée.

Proposer :

- recherches récentes avant saisie ;
- suggestions alternatives ;
- correction orthographique légère ;
- alternatives si aucun résultat exact.

---

# 74. Durée visible avant lecture

Afficher la durée avant de lancer :

- récitation ;
- épisode ;
- conférence ;
- rappel ;
- vidéo.

Permettre une sélection selon le temps disponible.

---

# 75. Liste des sourates

Rééquilibrer chaque ligne pour préserver :

- nom français ;
- nom arabe ;
- numéro ;
- métadonnées ;
- action principale.

Aucun élément ne doit être comprimé au point de nuire à la lisibilité.

---

# 76. Déploiement progressif du catalogue

Ouvrir progressivement :

- podcasts ;
- rappels ;
- conférences ;
- vidéos.

Préférer une petite sélection :

- autorisée ;
- sourcée ;
- bien présentée ;
- complète ;

plutôt qu’un grand catalogue incomplet.

---

# 77. Fiches récitant et intervenant

Chaque récitant/intervenant peut avoir une fiche comprenant :

- nom ;
- photo ;
- présentation ;
- langues ;
- rôle ;
- contenus ;
- séries ;
- récitations ;
- sources officielles ;
- liens externes ;
- suivi.

---

# 78. Séries de cours et conférences

Organiser les longues collections en séries.

Fonctions :

- ordre clair ;
- progression ;
- épisodes terminés ;
- épisode suivant ;
- bouton « Continuer » ;
- reprise à la bonne position ;
- distinction entre terminé / en cours / non commencé.

---

# 79. Suivi et notifications

Permettre de suivre :

- récitant ;
- intervenant ;
- série.

Notifications configurables séparément :

- nouvelles publications ;
- nouvel épisode ;
- nouvelle récitation ;
- nouveaux contenus d’une série.

Tout suivi et toute notification restent facultatifs.

---

# 80. Collections éditoriales

Créer des collections thématiques :

- sincérité ;
- patience ;
- famille ;
- apprentissage de la prière ;
- sîra ;
- fiqh ;
- comportement ;
- Ramadan ;
- Hajj ;
- etc.

Chaque collection doit indiquer :

- titre ;
- description concise ;
- sélectionneur / équipe éditoriale ;
- contenus inclus.

---

# 81. Sélections selon le temps disponible

Créer des entrées telles que :

- Quelques minutes ;
- Un trajet ;
- Une écoute approfondie.

Ces sélections peuvent filtrer automatiquement selon la durée.

---

# 82. Contrôle des recommandations

Permettre de masquer :

- une recommandation ;
- un sujet ;
- une source ;
- éventuellement un créateur.

L’accueil doit s’adapter aux préférences explicites de l’utilisateur.

---

# 83. Direction artistique des couvertures

Créer des covers distinctives à partir de :

- typographie ;
- calligraphie ;
- compositions abstraites ;
- textures discrètes ;
- formes géométriques ;
- photographie lorsque pertinente.

Éviter les cartes numérotées répétitives et les visuels trop uniformes.

---

# 84. Mini-player

Le mini-player doit conserver en priorité :

- nom de la sourate / contenu ;
- numéro du verset pour le Coran ;
- progression ;
- état de lecture ;
- bouton play/pause.

Le nom du récitant ne doit pas pousser hors écran les informations principales.

---

# 85. Player complet

Le player plein écran doit être un véritable espace d’écoute.

Afficher :

- contenu en cours ;
- artwork ou contexte visuel ;
- progression ;
- commandes principales ;
- options essentielles ;
- accès au texte ;
- file d’attente ;
- minuterie ;
- vitesse si pertinente ;
- téléchargement ;
- source.

---

# 86. File d’attente

Créer une file d’attente consultable et réorganisable.

Actions :

- déplacer ;
- retirer ;
- ajouter après ;
- ajouter en fin ;
- vider ;
- lancer immédiatement.

---

# 87. Commandes adaptées au type de contenu

## Coran

- verset précédent ;
- verset suivant ;
- répétition ;
- récitant ;
- texte ;
- traduction ;
- tafsir.

## Podcast / conférence

- retour de quelques secondes ;
- avance de quelques secondes ;
- vitesse ;
- chapitres ;
- transcription.

---

# 88. Progression audio du Coran

Distinguer :

1. progression dans le verset ;
2. progression globale dans la sourate.

Ne pas utiliser une seule barre ambiguë si elle peut être mal interprétée.

---

# 89. Minuterie d’écoute

Permettre :

- arrêt après X minutes ;
- fin du verset ;
- fin de la sourate ;
- fin de l’épisode ;
- fin du chapitre si pertinent.

---

# 90. Répétition avancée du Coran

Permettre :

- répétition d’un verset ;
- répétition d’un passage ;
- nombre de répétitions ;
- pause réglable entre répétitions.

---

# 91. Lecture écran verrouillé

Lorsque la plateforme le permet :

- lecture en arrière-plan ;
- commandes écran verrouillé ;
- play/pause ;
- suivant/précédent adaptés au contenu ;
- informations du média ;
- artwork.

---

# 92. Persistance de position

La position doit être conservée précisément après :

- pause ;
- fermeture ;
- rechargement ;
- interruption réseau ;
- changement d’appareil si connecté.

Ne jamais redémarrer arbitrairement un contenu au début.

---

# 93. Vitesse de lecture

Prévoir des préférences distinctes :

- vitesse récitation ;
- vitesse contenus parlés.

Ne pas appliquer automatiquement une vitesse de podcast à une récitation.

---

# 94. Téléchargement et hors connexion

Pour les contenus autorisés :

- téléchargement audio/vidéo ;
- texte associé ;
- transcription ;
- métadonnées ;
- taille visible ;
- état hors ligne visible.

---

# 95. Économie de données

Options :

- téléchargement Wi-Fi uniquement ;
- qualité audio ;
- qualité vidéo ;
- taille estimée ;
- suppression automatique optionnelle.

---

# 96. États du player

Distinguer clairement :

- lecture ;
- pause ;
- chargement ;
- buffering ;
- erreur ;
- hors ligne ;
- contenu indisponible.

Une animation ne doit jamais laisser croire qu’un contenu joue lorsqu’il est bloqué.

---

# 97. Retour de navigation

Quand l’utilisateur ouvre un contenu puis revient :

- conserver position de scroll ;
- conserver filtres ;
- conserver recherche ;
- conserver onglet ;
- conserver tri.

---

# 98. Lecture continue du Coran

Proposer deux vues :

1. cartes / versets ;
2. lecture continue, plus proche d’une page.

La vue continue doit être moins encadrée et laisser davantage de place au texte.

---

# 99. Actions par verset

Éviter une barre d’actions complète répétée au-dessus de chaque verset.

Conserver une action principale visible et déplacer les fonctions secondaires dans un menu contextuel discret.

---

# 100. Lisibilité pendant la récitation

Tous les mots du verset doivent rester lisibles.

Le mot actif peut être accentué, mais les mots inactifs ne doivent jamais devenir presque invisibles.

---

# 101. Fiabilité du suivi mot à mot

Utiliser uniquement des repères audio fiables.

Fallback :

```text
mot-à-mot disponible → suivi mot à mot
sinon → suivi par verset
```

Ne jamais simuler une précision absente des données.

---

# 102. Traduction synchronisée

La traduction peut être surlignée au niveau du passage / verset correspondant.

Ne pas simuler un mot-à-mot français aligné artificiellement sur chaque mot arabe.

---

# 103. Défilement automatique du Coran

Si l’utilisateur fait défiler manuellement :

- suspendre l’autoscroll ;
- ne pas ramener immédiatement à l’ayah active ;
- afficher un bouton « Revenir au verset en cours ».

---

# 104. Taille du texte

Permettre de régler séparément :

- taille arabe ;
- taille traduction.

Afficher un aperçu instantané.

---

# 105. Tajwid et code couleur

Expliquer explicitement :

- ce qui relève du suivi audio ;
- ce qui relève du tajwid ;
- ce qui relève du thème graphique.

La couleur d’accent du produit ne doit jamais redéfinir les couleurs pédagogiques.

---

# 106. Changement de récitant

Lors d’un changement de récitant :

- conserver la sourate ;
- conserver le verset courant ;
- tenter de conserver la position logique dans le verset ;
- ne pas repartir au début sauf nécessité technique explicite.

---

# 107. Traductions multiples

Permettre plusieurs traductions avec :

- auteur ;
- organisme ;
- langue ;
- version.

Permettre une comparaison ponctuelle d’un verset sans afficher plusieurs traductions en permanence.

---

# 108. Tafsir

Depuis chaque verset :

- accès au tafsir ;
- source ;
- auteur ;
- édition si disponible.

Séparer visuellement :

1. texte coranique ;
2. traduction ;
3. commentaire.

---

# 109. Navigation directe dans le Coran

Permettre d’ouvrir directement :

- sourate ;
- verset ;
- juz ;
- hizb.

Ne pas imposer le parcours d’une longue liste.

---

# 110. Mode mémorisation

Fonctions :

- masquer le texte ;
- révéler à la demande ;
- délai avant réécoute ;
- répétition ;
- passage personnalisé ;
- audio après récitation personnelle.

---

# 111. Suivi de lecture complète

Créer un suivi facultatif de lecture du Coran.

Possibilités :

- objectif flexible ;
- progression ;
- calendrier ;
- rythme ajustable.

Éviter :

- classement ;
- pression sociale ;
- pénalité ;
- culpabilisation en cas de journée manquée.

---

# 112. Lecture et écoute séparées

Maintenir deux progressions distinctes :

- progression de lecture ;
- progression d’écoute.

Un passage entendu ne doit pas être automatiquement marqué comme lu.

---

# 113. Partage d’un verset

Permettre de partager :

- texte arabe ;
- traduction choisie ;
- référence ;
- source de traduction ;
- lien profond vers le passage.

---

# 114. Transcriptions de contenus parlés

Étendre TimedTranscript à :

- podcasts ;
- conférences ;
- interviews ;
- vidéos.

Affichage adapté :

- phrase par phrase ;
- timestamp ;
- progression ;
- état du segment courant.

---

# 115. Navigation par transcription

Une phrase doit être interactive :

```text
tap sur phrase → seek au timestamp
```

Prévoir également :

- retour rapide au passage ;
- réécoute du segment ;
- partage du passage.

---

# 116. Recherche dans une transcription

Fonctions :

- recherche locale ;
- résultats horodatés ;
- contexte avant/après ;
- tap → seek.

---

# 117. Statut de transcription

Afficher si une transcription est :

- automatique ;
- corrigée ;
- validée.

Ajouter un moyen simple de signaler une erreur.

---

# 118. Chapitres des contenus longs

Pour les longues conférences :

- chapitres ;
- titres ;
- timestamps ;
- navigation directe ;
- progression par chapitre.

---

# 119. Passage vidéo / audio

Lorsque les deux formats existent et que les droits le permettent :

- passer de vidéo à audio ;
- conserver le timestamp ;
- conserver la transcription ;
- conserver la progression.

---

# 120. Citations religieuses et références

Lorsqu’une citation religieuse est affichée :

- indiquer la référence ;
- indiquer la source ;
- attribuer les appréciations d’authenticité à leurs auteurs ou institutions ;
- ne pas supprimer automatiquement un hadith parce qu’il est classé faible.

Le statut doit être présenté comme une information sourcée et attribuée.

---

# 121. Signalement de contenu

Prévoir un signalement discret pour :

- erreur de texte ;
- mauvais timing ;
- mauvaise source ;
- lien cassé ;
- contenu indisponible ;
- attribution incorrecte.

---

# 122. Bibliothèque centrée sur les usages

Remplacer les gros compteurs par des accès directs à :

- favoris ;
- playlists ;
- téléchargements ;
- marque-pages ;
- notes ;
- historique.

---

# 123. Historique lisible

Chaque ligne doit afficher clairement :

- contenu ;
- créateur ;
- date ;
- position de reprise ;
- progression.

Éviter les phrases tronquées ou générées automatiquement peu lisibles.

---

# 124. Favoris vs marque-pages

Séparer :

## Favori

Conserve un contenu apprécié dans son ensemble.

## Marque-page

Conserve un passage précis :

- ayah ;
- timestamp ;
- segment ;
- note éventuelle.

---

# 125. Playlists personnelles

Permettre :

- création ;
- renommage ;
- suppression ;
- réorganisation ;
- ajout/retrait.

L’utilisateur doit choisir explicitement si une playlist peut mélanger :

- récitations ;
- contenus parlés.

---

# 126. Notes

Chaque note doit être liée précisément à :

- verset ;
- passage ;
- timestamp ;
- contenu.

Permettre ensuite :

- recherche ;
- filtrage ;
- organisation par thème.

---

# 127. Compte facultatif

L’utilisation doit rester possible immédiatement sans inscription.

Le compte sert principalement à :

- synchronisation ;
- sauvegarde cloud ;
- multi-appareils ;
- restauration.

---

# 128. Synchronisation multi-appareils

Avec compte :

- favoris ;
- notes ;
- playlists ;
- préférences ;
- positions de reprise ;
- suivis ;
- progression.

---

# 129. Export et restauration

Permettre :

- export des données personnelles ;
- restauration ;
- sauvegarde portable.

Le produit ne doit pas enfermer l’utilisateur dans un stockage local opaque.

---

# 130. Contrôle de l’historique

Permettre :

- suppression d’un élément ;
- effacement complet ;
- pause de l’historique ;
- suppression des données personnelles.

Ces actions doivent être regroupées dans un espace clairement identifiable.

---

# 131. Confidentialité par défaut

Privés par défaut :

- notes ;
- historique ;
- playlists ;
- progression.

Tout partage doit être volontaire.

---

# 132. Onboarding minimal

Au premier démarrage, proposer éventuellement :

- langue ;
- récitants préférés ;
- centres d’intérêt.

Permettre de tout passer immédiatement.

---

# 133. Rappels facultatifs

Permettre des rappels d’écoute ou de révision :

- entièrement facultatifs ;
- horaires choisis ;
- fréquence choisie ;
- désactivation simple.

Ton des notifications :

- neutre ;
- bienveillant ;
- jamais culpabilisant.

---

# 134. Accessibilité

Tous les boutons doivent être compréhensibles par :

- VoiceOver ;
- TalkBack ;
- navigation clavier.

Ne jamais transmettre un état uniquement par couleur.

Prévoir :

- labels accessibles ;
- focus visible ;
- contraste ;
- zones tactiles suffisantes ;
- texte scalable.

---

# 135. Responsive tablette et desktop

Ne pas simplement étirer l’interface mobile.

Sur grands écrans, utiliser l’espace pour :

- texte ;
- file d’attente ;
- transcription ;
- informations du contenu ;
- navigation secondaire.

---

# 136. États vides et erreurs réseau

Prévoir des messages utiles pour :

- réseau absent ;
- contenu indisponible ;
- erreur de lecture ;
- bibliothèque vide ;
- aucun résultat.

Toujours proposer une action concrète.

---

# 137. Enchaînement entre types de contenus

Avant d’enchaîner automatiquement :

```text
récitation → podcast
récitation → conférence
Coran → contenu parlé
```

demander un choix explicite ou utiliser une préférence utilisateur clairement configurée.

Ne jamais mélanger automatiquement des types de contenus très différents sans consentement.

---

# 138. Priorités UX consolidées

Les principes suivants deviennent prioritaires dans toutes les futures itérations :

1. contenu visible immédiatement ;
2. player toujours clair ;
3. Coran lisible avant tout ;
4. recherche transversale rapide ;
5. progression fiable ;
6. synchronisation précise ;
7. aucune précision simulée ;
8. offline propre ;
9. confidentialité par défaut ;
10. compte facultatif ;
11. droits et sources visibles ;
12. interface accessible ;
13. recommandations contrôlables ;
14. catalogue progressif et qualitatif ;
15. zéro formulation technique visible par l’utilisateur.

---

# 139. Ordre de construction par dépendances

Le projet doit avancer strictement dans cet ordre :

0. Principes produit
1. Types de contenus et vocabulaire
2. Sources, droits et provenance
3. Modèle de données canonique
4. Architecture de lecture / playback
5. Architecture de navigation
6. Design system
7. Écrans fondamentaux
8. Recherche
9. Bibliothèque et compte
10. Offline / synchronisation
11. Import et administration
12. Transcription avancée
13. Recommandations
14. Fonctions avancées / IA

Une couche ne doit pas être figée tant que ses dépendances précédentes ne le sont pas.

# 140. Phase 0 — principes produit figés

L’application est d’abord un lecteur et une bibliothèque de contenus islamiques, pas un réseau social, une app de statistiques, une landing page marketing ou un clone visuel de Spotify.

Priorités : accéder au contenu, écouter/regarder/lire, reprendre précisément, connaître la source, retrouver un passage et sauvegarder ce qui compte.

Le compte est facultatif. Sans compte, l’utilisateur peut lire, écouter, regarder, rechercher et conserver localement sa progression. Avec compte, il obtient synchronisation, sauvegarde cloud, multi-appareils et restauration.

Le Coran est un domaine fonctionnel de premier niveau avec sourates, ayat, juz, hizb, récitations, traductions, tafsir, mémorisation et progressions de lecture/écoute distinctes.

Podcasts, rappels, cours, interviews et conférences partagent un socle média commun. La vidéo est un mode de consommation et non une architecture séparée lorsqu’un même contenu existe aussi en audio.

Aucun contenu externe ne peut être publié sans provenance et statut de droits connus.

L’IA peut enrichir transcription, recherche, chapitrage et découverte, mais ne constitue jamais une source canonique pour le texte coranique, une traduction publiée, une référence religieuse ou l’authenticité d’un hadith.

# 141. Phase 1 — vocabulaire canonique

Entités principales :

- **Coran** : structure canonique du texte.
- **Sourate** : chapitre du Coran.
- **Ayah** : verset identifié de manière stable.
- **Récitation** : interprétation audio du Coran liée à un récitant ; elle référence le texte canonique sans le dupliquer.
- **Récitant** : personne associée à une ou plusieurs récitations.
- **Créateur** : intervenant, enseignant, conférencier, podcasteur, organisme ou chaîne.
- **Contenu** : unité éditoriale hors structure canonique du Coran.
- **Série** : collection ordonnée de contenus.
- **Média** : ressource AUDIO ou VIDEO attachée à un contenu.
- **Transcript** : représentation textuelle synchronisable d’un contenu parlé.
- **Chapitre média** : section horodatée d’un contenu long.
- **Collection éditoriale** : sélection manuelle thématique.
- **Playlist** : collection personnelle ordonnée.
- **Favori** : sauvegarde d’un contenu complet.
- **Marque-page** : sauvegarde d’un ayah, timestamp ou segment précis.
- **Note** : texte privé lié à une cible précise.
- **Source** : provenance éditoriale/technique.
- **Licence/autorisation** : base juridique de diffusion et transformation.

Types initiaux de contenu :

`RAPPEL`, `COURS`, `CONFERENCE`, `INTERVIEW`, `PODCAST_EPISODE`, `VIDEO`.

Progressions distinctes :

`PLAYBACK_PROGRESS`, `QURAN_READING_PROGRESS`, `QURAN_LISTENING_PROGRESS`.

# 142. Taxonomie éditoriale initiale

Sujets de premier niveau :

- Coran
- Croyance
- Fiqh
- Sîra
- Hadith
- Spiritualité
- Comportement
- Famille
- Éducation
- Histoire
- Invocations
- Ramadan
- Hajj & Omra

Les thèmes précis restent des sous-thèmes/tags. Une catégorie principale ne doit apparaître que lorsqu’elle possède assez de contenu.

Type, sujet et format sont indépendants. Exemple : une conférence de 42 minutes sur la sincérité peut être `TYPE=CONFERENCE`, `SUJET=Spiritualité/Sincérité`, `MEDIA=AUDIO`, `LANGUE=fr`.

# 143. Langues et niveaux

Langues initiales : `fr`, `ar`, `en`. La langue du contenu est indépendante de celle de l’interface et un contenu peut posséder plusieurs sous-titres/traductions.

Niveaux facultatifs : `DECOUVERTE`, `DEBUTANT`, `INTERMEDIAIRE`, `APPROFONDISSEMENT`. Ils ne doivent jamais être inventés automatiquement.

# 144. Cycle éditorial

Cycle normal :

`DRAFT → RIGHTS_REVIEW → METADATA_REVIEW → READY → PUBLISHED`

États alternatifs :

`RIGHTS_REJECTED`, `UNAVAILABLE`, `ARCHIVED`.

Impossible de publier sans source, statut de droits, titre, langue, type et média fonctionnel.

# 145. Familles de lecture

Deux familles restent distinctes :

**Coran** : récitations, sourates, ayat.

**Contenus parlés** : rappels, cours, conférences, interviews, podcasts et vidéos parlées.

Une queue peut techniquement contenir les deux, mais l’application ne doit jamais passer automatiquement du Coran à un contenu parlé sans choix explicite.

# 146. Prochaine dépendance

La prochaine phase à terminer est **Sources, droits et provenance**.

Elle doit précéder le modèle de données définitif, car elle détermine ce qui peut être hébergé, streamé, téléchargé, transcrit, traduit ou transformé et quelles attributions doivent accompagner chaque contenu.