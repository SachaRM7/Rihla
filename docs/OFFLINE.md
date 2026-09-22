# Hors connexion sur cet appareil

Les téléchargements ne font pas partie des données synchronisées du compte. Le registre `rihla.downloads.v1` conserve les états et métadonnées dans le navigateur ; les fichiers complets sont dans Cache Storage, compartiment `rihla-offline-media-v1`.

## Autorisation

Un téléchargement exige des droits vérifiés humainement ou par le partenaire, sans révocation, et les deux permissions `hostCopy` et `downloadOffline`. Le contrôle est effectué avant le transfert, pas seulement sur le bouton. Les variantes appartiennent au média sélectionné. Le choix affiche uniquement les qualités réellement disponibles chez la source.

Les API Coran, leurs réponses et leurs récitations ne sont pas mises dans ce cache persistant. Aucun miroir de Quran Foundation n’est créé. Un enregistrement parlé publié séparément avec ses propres droits reste distinct d’une ressource obtenue via l’API Coran.

Pour le premier extrait Pickthall, la [notice Internet Archive](https://archive.org/metadata/meaning_glorious_koran_0810_librivox) déclare le [Public Domain Mark 1.0](https://creativecommons.org/publicdomain/mark/1.0/). Ces sources ont été relues automatiquement le 22 septembre 2026 pour aligner la capacité de copie sur la déclaration publiée. Cela n’ajoute pas une validation humaine ou juridique. Les autres entrées restent non téléchargeables tant que leur capacité `hostCopy` vaut `NO`.

## Réseau et stockage

- « Wi-Fi uniquement » refuse les connexions identifiées comme non Wi-Fi. Si le navigateur ne sait pas identifier la connexion, une confirmation explicite est requise pour chaque tentative.
- Une progression inconnue reste indéterminée ; la taille finale correspond aux octets reçus, pas à une estimation du catalogue.
- Un fichier effacé par le navigateur devient « Fichier manquant ». Une interruption peut être retentée ; elle ne promet pas une reprise HTTP au dernier octet.
- Une nouvelle source ou empreinte marque l’ancienne version à mettre à jour. La vérification du catalogue retire les téléchargements qui ne sont plus autorisés.
- Une révocation ne peut être découverte pendant une déconnexion complète. Elle s’applique lorsque le navigateur reçoit et vérifie le catalogue actualisé.
- Supprimer un téléchargement laisse les notes et la progression intactes. La suppression des données du navigateur peut retirer à la fois le registre et les médias.

## Shell et mises à jour

`npm run build` produit `offline-precache.js` à partir des fichiers statiques du build, avec une version calculée sur leur contenu. Le service worker est enregistré uniquement en production sur une origine sécurisée (ou localhost).

L’installation précache le document d’accueil public sans cookies et les ressources statiques. Une navigation publique échouant faute de réseau utilise ce shell ; l’application relit alors le chemin demandé. Les routes de compte, l’administration, les API, les requêtes RSC et les écritures restent exclues de cette stratégie. Les fichiers audio/vidéo explicitement téléchargés sont servis avec prise en charge des plages d’octets HTTP.

Une version nouvelle reste en attente jusqu’au choix « Recharger ». Les vieux caches du shell sont alors remplacés sans supprimer les téléchargements. « Plus tard » laisse la lecture en cours continuer. Un premier chargement réussi et l’installation du worker sont nécessaires pour rouvrir entièrement l’application hors réseau.

## Vérification

`node scripts/verify-offline-worker.mjs` teste les plages ouvertes, fermées, suffixées et invalides ; l’installation ; le nettoyage limité aux anciens shells ; les navigations, fichiers statiques et médias sans réseau ; l’exclusion des routes privées ; l’activation demandée par l’utilisateur.

La vérification navigateur doit également couvrir : téléchargement réel, rechargement réseau coupé, lecture et déplacement temporel, suppression, cache effacé, annulation et nouvelle tentative. Les simulations de navigateur ne valident pas les restrictions propres à Safari iOS ni la lecture en arrière-plan sur matériel réel.

## Choix d’interface

La liste sert à décider quoi écouter, retenter ou supprimer. Elle reprend les tokens de Rihla, avec une progression informative, des boutons de 44 px minimum et une confirmation de suppression. L’état n’est jamais indiqué seulement par une couleur. Aucun visuel ni mouvement décoratif n’a été ajouté.
