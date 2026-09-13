# RIHLA — plateforme audio/vidéo islamique

`RIHLA` est un nom de travail pour ce dépôt. Le produit réunit Coran audio, texte synchronisé, podcasts, conférences, vidéos et transcriptions dans une expérience cohérente, sans reprendre l’identité visuelle de Spotify.

## Première tranche incluse

- accueil éditorial responsive ;
- navigation Accueil, Recherche, Bibliothèque et Profil ;
- mini-player persistant avec lecture simulée et seek ;
- panneau « Afficher le Coran » avec ayah active synchronisée ;
- recherche globale et résultats avec timestamps ;
- bibliothèque et préférences de profil ;
- types TypeScript partagés pour le player et les transcriptions ;
- cadrage architectural et workflow de droits.

Les données affichées sont des données de démonstration. La source canonique du texte coranique et la traduction devront être sélectionnées, attribuées et intégrées via Quran Foundation ou une autre source autorisée avant toute publication.

## Démarrage local

```bash
npm install
npm run dev
```

Puis ouvrir l’URL locale affichée par le serveur.

## Vérifications

```bash
npm run build
npm run lint
```

## Stack

- Next.js 16 et TypeScript ;
- React 19 ;
- Tailwind CSS 4 ;
- cible PWA/web, avec logique de domaine réutilisable pour Expo plus tard ;
- Supabase prévu pour Auth, PostgreSQL, Storage et Edge Functions.

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) pour le découpage cible, les règles de séparation des contenus religieux et le workflow de droits.
