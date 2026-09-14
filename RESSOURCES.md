# Ressources produit et contenu

Ce registre doit être relu avant chaque nouveau lot fonctionnel. Il sépare les sources déjà branchées des pistes qui nécessitent encore une validation juridique ou technique.

Pour tout lot UI/UX, lire aussi `C:\Users\SachaRbone\.codex\RESSOURCES.md` puis `design-system/MASTER.md`. Les références servent à extraire des patterns adaptés à RIHLA — hiérarchie, densité, interaction, accessibilité et motion — et non à copier un écran.

## Coran — sources actuellement utilisées

- **Quran Foundation / Quran.com API v4** : texte uthmani, balises de tajwid, récitation et segments temporels mot à mot pour l’expérience karaoké.
- **Al Quran Cloud** : catalogue des sourates, traduction française `fr.hamidullah` et recherche plein texte.
- **Récitation active** : Mishary Rashid Alafasy, ressource Quran Foundation `7`.

Règles : conserver le texte arabe canonique, la traduction, le tafsir, la translittération, les notes utilisateur et tout contenu généré dans des champs et composants distincts. Ne jamais corriger silencieusement une traduction tierce.

## Ressources Coran à examiner avant branchement

- QuranEnc pour d’autres traductions françaises et leurs versions.
- Ressources Quran Foundation de tafsir, traductions, récitateurs et métadonnées de Juz.
- Toute nouvelle ressource doit documenter attribution, licence, limites d’API, cache autorisé et politique de stockage.

## Catalogue audio et vidéo

Priorité d’intégration :

1. contenus CC0 et domaine public ;
2. contenus CC BY avec attribution complète ;
3. contenus CC BY-SA après vérification de compatibilité ;
4. IslamHouse après validation au niveau du média ou autorisation globale ;
5. partenariat La Voie Droite / Islam Audio ;
6. Internet Archive uniquement avec filtre de licence explicite ;
7. créateurs partenaires ;
8. YouTube comme outil de découverte et lecteur officiel, sans aspiration automatique.

Écarter par défaut les licences inconnues, `All Rights Reserved`, CC BY-NC pour un produit potentiellement monétisé et CC BY-ND lorsqu’une transcription, traduction ou adaptation est prévue.

## Workflow obligatoire des droits

`RIGHTS_UNKNOWN → RIGHTS_REVIEW → RIGHTS_APPROVED → PUBLISHED`

`RIGHTS_REJECTED` bloque la publication.

Chaque média externe doit conserver : auteur, détenteur des droits, source originale, URL, type et version de licence, autorisation commerciale, dérivés, redistribution, texte d’attribution, date et URL de vérification, document d’autorisation et notes.

## Transcription

Pour les contenus autorisés seulement : OpenAI Speech-to-Text / Whisper, Deepgram, AssemblyAI, Google Speech-to-Text ou modèle auto-hébergé. Comparer précision arabe/français, diarisation, timestamps, coût et délai avant choix.

Une transcription automatique doit toujours être étiquetée comme telle, modifiable par le workflow éditorial et vérifiable contre le média source.

## Intégrations prévues

- Supabase : Auth, PostgreSQL, Storage, RLS et fonctions serveur.
- YouTube Data API : métadonnées, chaînes, recherche et lecture officielle selon les droits.
- PostgreSQL FTS au départ, puis Typesense, Meilisearch ou Algolia si le volume le justifie.

## Règle de décision

Une ressource gratuite à consulter n’est pas automatiquement réutilisable. Aucune donnée ou média externe ambigu ne doit être simulé ou publié pour remplir visuellement le catalogue.
