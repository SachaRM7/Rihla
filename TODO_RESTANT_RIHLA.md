# RIHLA — totalité des travaux restant à faire

> Inventaire consolidé après revue du dépôt `SachaRM7/Rihla`, des specs, de l’architecture cible et de l’état actuel de l’implémentation.
>
> Ce document ne répète pas comme “à faire” les fonctionnalités déjà livrées (socle Coran, notes, boucle A–B, playlists mixtes, recherche transversale, etc.). Il liste les chantiers restant à terminer, fiabiliser ou brancher avant une bêta publique solide, puis les extensions V2/V3.

## 1. Stabilisation technique immédiate

- Exécuter un build complet après les derniers changements.
- Exécuter lint et corriger toutes les erreurs TypeScript/React.
- Smoke-test de la version Cloudflare réellement déployée.
- Vérifier les parcours Coran, player, playlists, recherche, bibliothèque et réglages.
- Nettoyer imports, fonctions et composants devenus obsolètes.
- Vérifier les états loading, error, empty et retry partout.
- Tester les régressions introduites par les derniers gros chantiers.

## 2. Vrai catalogue de cours, rappels, conférences, podcasts et vidéos

Le `SPOKEN_CATALOG` est encore volontairement vide.

À faire :

- sélectionner des contenus réellement réutilisables ;
- valider les licences et autorisations ;
- ajouter créateurs ;
- séries ;
- épisodes/contenus ;
- audio et/ou vidéo ;
- artwork ;
- durées réelles ;
- langues ;
- thèmes/topics ;
- collections éditoriales ;
- chapitres ;
- variantes de qualité ;
- provenance ;
- attribution ;
- statuts de publication ;
- gestion des contenus retirés, archivés ou dont les droits sont révoqués ;
- vérification individuelle des sources comme IslamHouse, partenaires, Internet Archive, YouTube et autres sources retenues.

## 3. Backend réel Supabase

Il n’existe pas encore de projet Supabase RIHLA branché au produit.

À faire :

- créer/configurer le projet ;
- PostgreSQL ;
- migrations ;
- types générés ;
- Storage si nécessaire ;
- Edge Functions si nécessaire ;
- environnements dev/prod ;
- sauvegardes ;
- politiques RLS ;
- index ;
- contraintes d’intégrité ;
- audit sécurité/performance Supabase.

## 4. Comptes utilisateurs

- inscription ;
- connexion ;
- déconnexion ;
- mot de passe oublié ;
- changement d’email ;
- changement de mot de passe ;
- suppression du compte ;
- session persistante ;
- éventuel magic link ;
- éventuel Google/Apple si retenu ;
- mode invité toujours utilisable ;
- migration des données locales d’un invité vers son compte lors de l’inscription.

## 5. Synchronisation multi-appareils

Synchroniser :

- favoris ;
- marque-pages ;
- notes privées ;
- playlists ;
- ordre des playlists ;
- historique ;
- progression Coran en lecture ;
- progression Coran en écoute ;
- progression des contenus parlés ;
- récitant ;
- préférences ;
- objectifs de lecture ;
- abonnements créateurs/séries ;
- recommandations masquées ;
- éventuellement file d’attente.

Ajouter :

- fusion local ↔ cloud ;
- résolution de conflits ;
- fonctionnement offline puis resynchronisation ;
- restauration sur nouvel appareil.

## 6. Versionnement propre du stockage utilisateur

`LocalLibrary` est encore versionné en `1`.

À faire :

- vrai système de migrations de schéma ;
- migration des anciennes données sans perte ;
- tests données corrompues/incomplètes ;
- gestion des anciennes versions ;
- éviter de dépendre indéfiniment d’un énorme objet local unique.

## 7. Routage réel et deep links

Implémenter de vraies routes publiques :

- `/quran/:surah`
- `/quran/:surah/:ayah`
- `/content/:slug`
- `/series/:slug`
- `/creator/:slug`
- `/collection/:slug`

Puis :

- back/forward navigateur correct ;
- URL reflétant l’écran courant ;
- restauration du scroll ;
- restauration des filtres ;
- restauration de la recherche ;
- deep links partageables ;
- player persistant entre navigations.

## 8. File d’attente universelle

La queue existe mais doit devenir un vrai moteur de lecture séquentielle.

À faire :

- ajouter le Coran à la queue ;
- contenus parlés ;
- lecture automatique du suivant ;
- élément courant ;
- previous/next cohérent ;
- réorganisation pendant lecture ;
- suppression de l’élément courant ;
- vider proprement ;
- “Lire ensuite” ;
- “Ajouter à la fin” ;
- règle Coran ↔ parlé avec consentement ;
- persistance après reload ;
- gestion d’un contenu devenu indisponible ;
- interaction correcte queue ↔ playlists.

## 9. Player universel final

- unifier Coran / audio / vidéo ;
- mini-player pour contenus parlés ;
- player complet contenu parlé ;
- passage mini-player → full player ;
- un seul média à la fois ;
- audio ↔ vidéo à timestamp identique ;
- MediaSession complète ;
- metadata lockscreen correctes ;
- artwork lockscreen ;
- commandes casque ;
- background playback ;
- reprise après pause longue ;
- autoplay bloqué ;
- buffering ;
- retry réseau ;
- média expiré ;
- changement de source ;
- sleep timer audio et vidéo ;
- chapitres ;
- transcript ;
- queue depuis le player ;
- layout desktop player/transcript/queue.

## 10. Téléchargement hors connexion complet

Le Cache Storage est branché mais le chantier n’est pas terminé.

Point intermédiaire du 22 septembre 2026 : implémentation, preuves de test et limites consignées dans [docs/REPRISE.md](docs/REPRISE.md). La liste ci-dessous reste le périmètre à valider avant clôture du chantier.

À faire :

- Service Worker ;
- app shell disponible offline ;
- lecture réelle depuis le média téléchargé sans réseau ;
- registre persistant des téléchargements ;
- taille réelle ;
- progression ;
- annulation ;
- suppression ;
- retry ;
- gestion quota disque ;
- détection de cache supprimé par le navigateur ;
- nettoyage médias orphelins ;
- choix qualité ;
- Wi-Fi uniquement avec fallback ;
- section Téléchargements dans Bibliothèque ;
- gestion droits révoqués ;
- gestion nouvelles versions ;
- règles précises pour les ressources Coran ;
- ne pas transformer le cache Quran Foundation en miroir permanent non autorisé.

## 11. PWA réellement finie

- Service Worker ;
- icônes 192/512 ;
- icônes maskable ;
- icône iOS ;
- écran de lancement ;
- stratégie d’update ;
- état “nouvelle version disponible” ;
- installation Android/Desktop ;
- UX installation iOS ;
- mode standalone testé ;
- offline navigation ;
- safe areas PWA ;
- theme/status bar cohérents.

## 12. Coran : sources et données à fiabiliser

- confirmer définitivement les conditions d’utilisation et cache ;
- vérifier toutes les attributions ;
- remplacer les données calculées manuellement par données canoniques quand possible ;
- vérifier Juz/Hizb contre une source canonique ;
- remplacer les estimations heuristiques de durée par des durées réelles quand disponibles ;
- vérifier timings mot-à-mot ;
- fallback quand timing non fiable ;
- vérifier tous les récitateurs proposés ;
- confirmer comportement de changement de récitant ;
- tester sourates longues.

## 13. Navigation Coran complète

- parcourir par sourate ;
- parcourir par Juz ;
- parcourir par Hizb ;
- parcourir par récitant ;
- précédent/suivant entre sourates ;
- dernier passage lu ;
- dernier passage écouté ;
- pages/sections récitateurs si retenues ;
- maintenir lecture et écoute comme deux progressions distinctes.

## 14. Traductions françaises

- brancher des traductions alternatives autorisées ;
- vérifier versions ;
- attribution ;
- comparaison réelle ;
- choix par défaut ;
- persistance du choix ;
- ne jamais modifier silencieusement une traduction tierce.

## 15. Tafsir

Le bouton existe mais aucun tafsir réel n’est encore connecté.

À faire :

- choisir sources autorisées ;
- vérifier droits ;
- attribution ;
- charger le commentaire correspondant au verset ;
- navigation ;
- afficher clairement source/auteur ;
- séparation stricte tafsir / traduction / texte coranique ;
- état absence de tafsir ;
- recherche éventuelle dans les commentaires plus tard.

## 16. Recherche transversale finale

Le chantier UI est construit mais doit être validé avec un vrai catalogue parlé.

À faire :

- Coran + parlé simultanément ;
- titre ;
- créateur ;
- série ;
- description ;
- traduction du Coran ;
- référence ;
- filtres dynamiques réels ;
- ranking ;
- tolérance fautes/translittérations ;
- aucun résultat ;
- historique ;
- suggestions ;
- performance gros catalogue ;
- PostgreSQL FTS ;
- Typesense/Meilisearch/Algolia seulement si nécessaire ;
- recherche sémantique plus tard si utile.

## 17. Accueil réellement alimenté

- Reprendre Coran ;
- Reprendre contenus parlés ;
- écoutes récentes ;
- contenus suivis ;
- nouveautés ;
- collections éditoriales ;
- accès rapides ;
- sélections par durée avec durées réelles ;
- supprimer les choix statiques artificiels ;
- état nouvel utilisateur ;
- état sans catalogue parlé ;
- état offline ;
- aucune section artificiellement remplie.

## 18. Recommandations

Le mécanisme masquer/restaurer existe, pas le vrai moteur.

À faire :

- recommandations éditoriales simples ;
- uniquement contenus disponibles/licenciés ;
- éventuellement historique/follows ;
- aucune mécanique culpabilisante ;
- explicabilité si personnalisées ;
- respecter historique désactivé ;
- confidentialité ;
- exclure média indisponible ou masqué ;
- personnalisation avancée en V2/V3 seulement.

## 19. Profils créateur et séries

- vrais profils alimentés ;
- artwork/avatar ;
- bio vérifiée ;
- liens officiels ;
- séries ;
- épisodes ;
- tri chronologique ;
- follow/unfollow réel ;
- notifications ;
- partage ;
- deep links ;
- gestion contenus archivés/manquants.

## 20. Collections éditoriales

- vraies collections ;
- ordre manuel ;
- titre/description ;
- curateur/source ;
- mélange de contenus si pertinent ;
- page détail ;
- deep link ;
- publication/dépublication ;
- présence accueil/recherche.

## 21. Transcriptions

- choisir moteur STT ;
- valider droits de dérivation pour chaque média ;
- générer transcription ;
- timestamps ;
- français/arabe ;
- diarisation ;
- statut automatique ;
- correction humaine ;
- statut corrigé ;
- validation finale ;
- versioning ;
- recherche transcript ;
- seek par segment ;
- partage timestamp ;
- corrections ;
- remplacement/suppression d’une mauvaise transcription.

## 22. Signalement des erreurs

Le formulaire existe mais le signalement serveur n’est pas encore branché.

À faire :

- persister signalements ;
- utilisateur éventuel ;
- contenu ;
- timestamp ;
- type d’erreur ;
- texte facultatif ;
- file admin ;
- statut ouvert/résolu/rejeté ;
- historique ;
- ne jamais annoncer qu’un signalement a été traité s’il ne l’est pas.

## 23. Administration / back-office

Entièrement à construire :

- création contenu ;
- modification ;
- créateurs ;
- séries ;
- collections ;
- topics ;
- médias ;
- variantes ;
- chapitres ;
- transcriptions ;
- artwork ;
- publication ;
- archivage ;
- droits ;
- sources ;
- documents d’autorisation ;
- audit trail ;
- doublons ;
- validation éditoriale ;
- santé des liens média ;
- retrait rapide d’un contenu.

## 24. Pipeline d’import

- adaptateurs par source ;
- YouTube Data API pour métadonnées/lecture officielle autorisée ;
- IslamHouse selon droits ;
- Internet Archive avec filtre licence ;
- partenaires directs ;
- normalisation ;
- doublons ;
- contrôle droits avant publication ;
- rien ne passe automatiquement en `PUBLISHED`.

## 25. Workflow juridique des droits

Rendre réel :

`RIGHTS_UNKNOWN → RIGHTS_REVIEW → RIGHTS_APPROVED → PUBLISHED`

Ajouter :

- blocage automatique licence incompatible ;
- auteur ;
- détenteur ;
- licence/version ;
- source originale ;
- autorisation commerciale ;
- modification ;
- redistribution ;
- transcription ;
- téléchargement ;
- hébergement de copie ;
- attribution ;
- date de vérification ;
- preuve/document ;
- révocation ;
- revue périodique.

## 26. Rappels et notifications réelles

Le rappel navigateur actuel ne garantit pas une notification app fermée.

À faire :

- Service Worker / Push API ou serveur ;
- rappel lecture ;
- nouveaux contenus suivis ;
- préférences par type ;
- permission refusée ;
- désactivation ;
- fuseau horaire ;
- heures silencieuses si nécessaire ;
- aucune pression/streak culpabilisante.

## 27. Bibliothèque finale

- favoris sourates ;
- marque-pages ayat ;
- notes ;
- playlists ;
- historique ;
- téléchargements ;
- contenus suivis ;
- créateurs suivis ;
- séries suivies ;
- reprises ;
- tri ;
- filtres ;
- recherche locale ;
- états vides ;
- éléments indisponibles ;
- suppression individuelle ;
- suppression globale ;
- remplacer les `window.prompt` temporaires par de vrais dialogs/selecteurs ;
- drag/reorder naturel si retenu.

## 28. Réglages finaux

- apparence ;
- accent ;
- taille arabe ;
- taille traduction ;
- traduction on/off ;
- auto-scroll ;
- récitant ;
- vitesse Coran ;
- vitesse contenus parlés ;
- qualité audio ;
- Wi-Fi uniquement ;
- historique on/off ;
- auto-avance inter-formats ;
- notifications ;
- objectifs de lecture ;
- mode mémorisation ;
- données offline ;
- utilisation stockage ;
- compte ;
- synchronisation ;
- confidentialité ;
- export ;
- import ;
- suppression données ;
- suppression compte.

## 29. Objectifs de lecture / Khatma

Le socle existe.

À vérifier/compléter :

- modes 30/60/90/180/365 jours ;
- recalcul lors du changement d’objectif ;
- journée locale/fuseau ;
- éviter doubles comptages ;
- vue progression ;
- reprise logique ;
- sync cloud ;
- aucun ranking/streak culpabilisant.

## 30. Mode mémorisation

Tester/fiabiliser :

- masquage/révélation ;
- auto-scroll ;
- boucle A–B ;
- repeat ayah ;
- changement récitant ;
- passage suivant ;
- reload ;
- accessibilité ;
- petit mobile.

## 31. Partage

- deep links sur routes publiques ;
- verset ;
- timestamp ;
- traduction/auteur ;
- contenu parlé ;
- épisode ;
- créateur ;
- série ;
- collection ;
- Open Graph ;
- Native Share ;
- clipboard fallback ;
- respect des droits dans les previews.

## 32. SEO / web public

- metadata ;
- titres par page ;
- descriptions ;
- canonical ;
- Open Graph ;
- sitemap ;
- robots ;
- pages créateur/série/contenu indexables quand pertinent ;
- politique d’indexation des pages Coran ;
- données structurées si utiles.

## 33. Accessibilité finale

- audit clavier ;
- VoiceOver iOS ;
- TalkBack Android ;
- lecteur d’écran desktop ;
- focus après navigation ;
- dialogs ;
- ARIA player ;
- targets 44 px ;
- contraste dark/light ;
- reduced motion ;
- zoom navigateur ;
- RTL ;
- taille système ;
- états non dépendants uniquement de la couleur ;
- tests lockscreen et contrôles média.

## 34. Responsive complet

Tester :

- 320 ;
- 360 ;
- 390 ;
- 430 ;
- tablette ;
- desktop 1440 ;
- grand desktop ;
- landscape mobile ;
- iPhone encoche/Dynamic Island ;
- Android ;
- safe areas navigation + mini-player + playlist bar + spoken player ;
- aucun contenu masqué par surfaces persistantes.

## 35. Performance

- réduire le gros `app-shell.tsx` ;
- découper par écran/fonction ;
- réduire le CSS global massif ;
- lazy-load surfaces lourdes ;
- virtualisation/rendu progressif listes longues ;
- cache réseau raisonné ;
- abort requêtes obsolètes ;
- images optimisées ;
- artwork responsive ;
- mesurer LCP/CLS/INP ;
- tester longue sourate + long transcript ;
- limiter mémoire audio/vidéo.

## 36. Fiabilité réseau

- retry/backoff ;
- timeout ;
- source lente ;
- coupure en pleine lecture ;
- retour réseau ;
- passage Wi-Fi/4G ;
- média partiellement chargé ;
- données API incomplètes ;
- source changeant d’URL ;
- fallback sans perdre position.

## 37. Sécurité

- CSP ;
- headers sécurité ;
- CORS ;
- validation Zod serveur ;
- rate limiting ;
- endpoints admin protégés ;
- RLS Supabase ;
- aucun secret client ;
- uploads sécurisés ;
- MIME/taille ;
- protection contenu malveillant dans descriptions/transcripts ;
- dependency audit ;
- logs sans données privées inutiles.

## 38. Vie privée / RGPD

- politique de confidentialité ;
- CGU ;
- base légale ;
- historique opt-out ;
- export ;
- suppression ;
- durée de conservation ;
- suppression compte complète ;
- analytics respectueux de la vie privée si ajoutés ;
- documentation sous-traitants ;
- cookies seulement si nécessaires.

## 39. Observabilité

- erreurs client ;
- erreurs serveur ;
- erreurs player ;
- échecs médias ;
- latence APIs ;
- zéro résultat recherche ;
- échec téléchargement ;
- logs Cloudflare ;
- alertes ;
- éventuellement Sentry ;
- ne jamais logger le contenu des notes privées.

## 40. Analytics produit éventuels

Seulement si utiles :

- lancement lecture ;
- erreurs ;
- recherche ;
- offline ;
- parcours anonymisés/minimisés ;
- consentement si nécessaire ;
- aucune surveillance excessive.

## 41. Tests automatisés

- navigation Juz/Hizb ;
- parse référence ;
- sanitizers localStorage ;
- migrations ;
- rights gate ;
- queue ;
- playlists ;
- transition inter-formats ;
- player Quran ;
- player spoken ;
- search ;
- offline ;
- permissions ;
- composants ;
- E2E critiques.

## 42. Matrice QA appareils/navigateurs

- Safari iOS ;
- Chrome iOS ;
- Chrome Android ;
- Safari macOS ;
- Chrome desktop ;
- Firefox ;
- Edge ;
- PWA installée ;
- mode privé ;
- stockage bloqué ;
- réseau lent ;
- offline ;
- écran verrouillé ;
- casque/Bluetooth.

## 43. CI/CD propre

- build automatique ;
- lint automatique ;
- tests automatiques ;
- previews de branches si utile ;
- prod Cloudflare ;
- secrets par environnement ;
- rollback ;
- vérification post-déploiement ;
- ne pas dépendre uniquement d’un push direct sur main.

## 44. Cloudflare / infra

- variables d’environnement ;
- enlever/configurer bindings placeholder ;
- cache headers ;
- domaine final ;
- HTTPS ;
- logs ;
- limites Workers ;
- monitoring ;
- staging éventuel ;
- retirer les restes d’hébergement inutilisés ;
- déconnecter Vercel si toujours présent.

## 45. Documentation à remettre à jour

- README encore ancien ;
- tâches du spec MVP `001` non cochées alors que beaucoup sont faites ;
- spec `007` encore obsolète ;
- architecture à mettre à jour avec Cloudflare et état réel ;
- documenter Supabase ;
- offline ;
- catalogue ;
- droits ;
- admin ;
- migrations `LocalLibrary`.

## 46. Design final avec vraies données

Repasser sur :

- Accueil ;
- Recherche ;
- Coran ;
- lecture verset ;
- Bibliothèque ;
- Réglages ;
- player Coran ;
- player contenu parlé ;
- profils créateur ;
- séries ;
- collections ;
- téléchargements ;
- transcripts ;
- états vides ;
- erreurs ;
- données longues/réelles ;
- mobile ;
- desktop ;
- retrait des patterns temporaires comme `window.prompt`.

## 47. Avant une vraie bêta publique

- catalogue suffisamment alimenté ;
- droits validés ;
- auth/sync opérationnels ou décision claire de lancer sans compte ;
- offline fiable ;
- PWA fiable ;
- build/test vert ;
- QA appareils ;
- privacy/CGU ;
- signalement opérationnel ;
- monitoring ;
- sauvegardes ;
- domaine final ;
- aucun faux contenu ;
- aucun texte dev visible ;
- aucun workflow présenté comme serveur alors qu’il est seulement local.

## 48. Plus tard — V2/V3

Pas nécessaire au premier lancement :

- recherche sémantique ;
- recommandations intelligentes ;
- IA pour classement/recherche de transcripts en gardant séparation stricte avec les textes religieux ;
- traductions supplémentaires ;
- plus de tafasir ;
- applications natives Expo ;
- Cast/AirPlay ;
- Android Auto/CarPlay ;
- import/export avancé ;
- expérience TV ;
- outils éditoriaux poussés ;
- partenariats éditeurs/créateurs ;
- internationalisation de l’interface.

# Chemin critique restant

Ordre recommandé :

1. stabiliser le dépôt et le déploiement ;
2. brancher un vrai catalogue et ses droits ;
3. créer backend/comptes/synchronisation ;
4. finaliser queue/player/offline/PWA ;
5. brancher tafsir/transcriptions et enrichissements ;
6. construire admin/import/droits ;
7. terminer QA/sécurité/RGPD/observabilité ;
8. préparer la bêta publique.

Le travail restant n’est donc plus une succession de micro-ajouts UI. Les prochains livrables doivent être traités comme des chantiers fonctionnels complets.
