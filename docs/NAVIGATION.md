# Architecture de navigation — Phase 5

La navigation est définie avant le design visuel.

## Navigation principale

Ordre mobile et desktop :

1. Accueil
2. Recherche
3. Coran
4. Bibliothèque

Les Réglages sont accessibles depuis l’en-tête et ne constituent pas un onglet principal.

## Responsabilités

### Accueil
Page d’écoute, jamais page de présentation.
- reprendre immédiatement ;
- accès rapides ;
- contenus suivis ;
- quelques découvertes disponibles ;
- sélections éditoriales réellement alimentées.

### Recherche
Recherche transversale.
- champ en premier élément ;
- recherches récentes ;
- résultats Coran + contenus parlés ;
- filtres contextuels ;
- extraits justifiant le résultat.

### Coran
Point d’entrée canonique pour parcourir :
- sourates ;
- ayat ;
- juz ;
- hizb ;
- récitateurs.

La lecture et l’écoute du Coran restent accessibles dans ce contexte.

### Bibliothèque
Contenus personnels uniquement :
- favoris ;
- marque-pages ;
- playlists ;
- téléchargements ;
- notes ;
- historique.

Aucun réglage d’apparence ou de lecture n’y est mélangé.

### Réglages
Surface secondaire :
- apparence clair/sombre/auto ;
- accent ;
- tailles arabe/traduction ;
- préférences audio ;
- données/offline ;
- notifications ;
- confidentialité ;
- compte/synchronisation.

## Surfaces persistantes

### En-tête
Compact. Contient identité/contexte utile et accès Réglages. Aucun compteur de cœur.

### Mini-player
Persistant quand un média existe. Il ne doit jamais masquer le dernier contenu : le shell réserve son espace.

### Navigation mobile
Persistante en bas. L’espace sûr inclut navigation + mini-player.

### Player complet
Overlay/surface dédiée au-dessus du shell. Fermer le player restaure exactement l’écran et le scroll précédents.

## État de navigation

Chaque vue conserve :
- scroll ;
- recherche ;
- filtres ;
- tri ;
- sélection courante.

Ouvrir puis fermer un contenu ne réinitialise pas la vue précédente.

## Deep links

Contrats prévus :
- /quran/:surah
- /quran/:surah/:ayah
- /content/:slug
- /series/:slug
- /creator/:slug
- /collection/:slug

Le prototype peut continuer à utiliser un shell client tant que les URLs publiques ne sont pas encore migrées, mais le domaine ne doit pas dépendre de ce choix.

## Desktop/tablette

Le desktop ne doit pas être un mobile étiré.
- sidebar possible ;
- lecture + queue/transcript en colonnes ;
- largeur de lecture limitée ;
- contexte supplémentaire dans l’espace disponible.

## Dépendance suivante

L’architecture de navigation étant fixée, la Phase 6 peut définir le design system : tokens, densité, typographie, surfaces, états, thèmes et composants de base. Seulement ensuite les écrans fondamentaux seront refondus.
