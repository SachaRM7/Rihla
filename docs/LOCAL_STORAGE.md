# Stockage local et migrations

RIHLA reste utilisable sans compte. Depuis le schéma `LocalLibrary` v2, les données locales sont stockées en tranches indépendantes dans localStorage :

- `rihla.library.v2.meta` : reprise et position Quran ;
- `rihla.library.v2.quran` : favoris, marque-pages, historique, notes et jours lus ;
- `rihla.library.v2.spoken` : progressions audio parlé, file et vitesse ;
- `rihla.library.v2.preferences` : apparence, lecture, rappels et objectifs ;
- `rihla.library.v2.collections` : playlists, abonnements et recommandations masquées.

Le fichier historique `rihla.library.v1` reste lu comme source de migration. La fonction `migrateLocalLibraryPayload` convertit les payloads v0/v1 vers v2, rejette les versions futures et laisse `sanitizeLibrary` compléter les champs manquants ou écarter les entrées invalides. Une tranche corrompue n’empêche donc pas la restauration des autres tranches.

La sauvegarde JSON exportée conserve le format complet et versionné pour rester portable. Le cloud utilise le même payload v2 dans un snapshot privé et dans le journal append-only de synchronisation.

Vérification locale :

```text
node --experimental-strip-types scripts/verify-library-migrations.mjs
```
