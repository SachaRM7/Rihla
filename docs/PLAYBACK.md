# Contrat du moteur de lecture — Phase 4

Le player est défini avant les écrans. Son contrat exécutable est dans `lib/playback.ts`.

## Invariants

- Un seul item courant.
- La queue est ordonnée et réorganisable.
- La position est persistée séparément du rendu UI.
- Les états IDLE, LOADING, PLAYING, PAUSED, BUFFERING et ERROR sont explicites.
- Les préférences de vitesse Coran et contenus parlés sont séparées.
- Une transition automatique entre Coran et contenu parlé est interdite par défaut.
- Le moteur expose un temps courant unique aux transcriptions.
- La progression Coran et la progression média restent distinctes.

## Commandes adaptées

Le contrat de base expose play, pause, seek, queue, next et previous.

La couche Coran interprétera previous/next comme navigation logique par ayah lorsque le contexte le permet. La couche contenu parlé pourra exposer des helpers de saut temporel sans modifier le cœur du moteur.

## Reprise

La progression doit être sauvegardée périodiquement, à la pause, au changement d’item et avant fermeture lorsque l’environnement le permet.

Une erreur réseau ne remet jamais la position à zéro.

## Queue

La queue peut techniquement contenir plusieurs familles. Le moteur appelle la règle `canAutoAdvance` avant toute transition. Coran → contenu parlé et contenu parlé → Coran exigent une action explicite.

## Synchronisation texte

`TimedTranscript` ne contrôle pas le player. Il consomme `positionMs` et émet une commande SEEK lorsqu’un segment est touché. Cette séparation évite de coupler le transcript à l’élément audio HTML.

## Phase suivante

Le moteur étant contractuellement défini, la prochaine dépendance est **l’architecture de navigation** : routes, shells, zones persistantes et responsabilité de chaque écran, avant le design system et avant la refonte visuelle.
