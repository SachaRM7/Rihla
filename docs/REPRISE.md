# Point de reprise — 22 septembre 2026

Travail mis en pause à la demande de l’utilisateur, après sauvegarde du lot cohérent sur `main`. Ne pas poursuivre automatiquement les chantiers suivants.

## Avancement réel

Les chantiers 1 à 9 ont leurs commits dans l’historique. Cela ne signifie pas que leur validation en production ou sur appareils réels est terminée. Le lot actuel constitue un **point intermédiaire du chantier 10**, avec des corrections nécessaires du lecteur du chantier 9. Les 48 chantiers ne sont pas terminés.

Le chantier 10 dispose désormais de :

- registre local persistant et cache média séparé des données synchronisées ;
- contrôle des droits avant transfert, empreinte, progression et taille réellement reçue ;
- annulation, suppression avec confirmation, nouvelle tentative, erreurs de quota et détection des fichiers manquants ;
- choix parmi les qualités effectivement disponibles, règle Wi-Fi et consentement si le réseau ne peut pas être identifié ;
- section Téléchargements dans la Bibliothèque ;
- service worker de production, shell public hors connexion, plages HTTP et mise à jour demandée par l’utilisateur ;
- génération du manifeste de précache lors de `npm run build`.

Les correctifs du lecteur stabilisent la source audio/vidéo, préservent l’élément média entre petit et grand lecteur, restaurent la position lors des changements de source, lisent le fichier local téléchargé et empêchent une reprise différée du Coran après sa mise en pause. Le partage de MediaSession entre lecteurs est protégé par un propriétaire explicite.

La notice et la licence publique du premier extrait Pickthall ont été relues automatiquement pour autoriser sa copie locale. Ce n’est pas une nouvelle validation humaine ou juridique. Les autres entrées restent non téléchargeables ; les API Coran et leurs récitations sont exclues du cache persistant. Voir [OFFLINE.md](OFFLINE.md).

## Vérifications effectuées

- `npx --no-install tsc --noEmit` : réussi.
- `npm run lint` : réussi.
- `npm run build` : réussi, y compris la génération du manifeste hors connexion (13 ressources statiques).
- `npm run test:offline` : service worker réussi et 26 vérifications du gestionnaire réussies, dont révocation, fichier corrompu, quota, écriture du registre impossible, annulation pendant l’écriture et réponse tardive d’une ancienne tentative.
- `npm run test:player` : propriété des variantes, choix de qualité, bornes temporelles et changement de propriétaire MediaSession réussis.
- `npm run test:storage` : migrations réussies.
- Navigateur Edge/Chromium : téléchargement réel du premier extrait Pickthall (919 854 octets), lecture depuis une URL Blob sans réseau, conservation du même élément média entre modes du lecteur.
- Build de production servi localement : service worker actif ; ouverture directe de `/content/pickthall-al-fatiha-audio` sans réseau après installation ; lecture du fichier local après ce rechargement.
- Contrôle visuel à 390 × 844 de la boîte de téléchargement. Audit axe limité au lecteur : aucune violation signalée, un contraste sur l’illustration reste à vérifier manuellement. Ce n’est pas une certification d’accessibilité globale.

Les tests de stockage utilisent des environnements simulés ; ils ne remplacent pas tous les scénarios navigateur et appareils.

## À reprendre avant de clôturer le chantier 10

1. Examiner les opérations concurrentes : réconciliation pendant un transfert, plusieurs onglets et suppression d’un fichier dont l’URL est partagée par plusieurs enregistrements. Vérifier le signalement d’un échec de suppression du cache.
2. Compléter les scénarios navigateur : suppression effective, cache purgé extérieurement, annulation/nouvelle tentative, mise à jour du service worker acceptée ou différée, déplacement temporel hors connexion et changement audio/vidéo avec un média adapté.
3. Vérifier la priorité de la règle Wi-Fi sur un réseau explicitement identifié comme cellulaire, même si un ancien consentement est transmis.
4. Tester les contraintes Safari/iOS, Android, mode autonome, lecture en arrière-plan, écran verrouillé et commandes casque sur appareils réels. L’essai Chromium ne les valide pas.
5. Auditer la provenance des statuts `HUMAN_VERIFIED` déjà présents dans le catalogue. Ne pas assimiler une vérification automatique de notice à une validation humaine.

Après ces contrôles et corrections, reprendre le chantier 11 puis la suite de [TODO_RESTANT_RIHLA.md](../TODO_RESTANT_RIHLA.md), avec un commit et un push par chantier réellement terminé.

## Dépendances externes toujours ouvertes

La configuration réelle des environnements Supabase, leurs accès et les validations dev/production ne sont pas démontrés par ce lot. Aucune ressource distante n’a été provisionnée ici. Les contrôles nécessitant un compte, des secrets, des droits éditoriaux ou un appareil doivent être distingués de l’implémentation locale.
