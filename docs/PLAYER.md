# Player universel

Rihla maintient un seul média actif à la fois. Le lecteur parlé partage le même cycle de lecture que le Coran : mini-player persistant, player complet, reprise locale, file universelle et commandes précédente/suivante.

- Les contenus parlés peuvent être lus en audio ou en vidéo ; le changement de format conserve la position courante et ne lance le nouveau média qu’après son chargement.
- Un autoplay demandé par la file est tenté une seule fois. Si le navigateur le bloque, le lecteur affiche une action de lecture explicite.
- Les erreurs de chargement restent récupérables par retry ; une source expirée est signalée comme indisponible sans effacer la progression sauvegardée.
- MediaSession publie le titre, l’auteur, l’album, l’artwork, la position, la vitesse et les commandes lecture/pause, piste précédente/suivante, avance/recul et seek.
- La file peut être enrichie depuis le player complet ; les chapitres et la transcription restent synchronisés avec la position du média.
