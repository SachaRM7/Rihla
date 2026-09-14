# Spécification — Convergence UI/UX de l’existant

## Objectif

Appliquer `RESSOURCES.md` et `design-system/MASTER.md` à l’ensemble de l’application actuelle avant toute nouvelle fonctionnalité.

## Périmètre

- préserver l’identité sombre, calme et premium de RIHLA ;
- garantir une lecture confortable de 320 px au grand écran ;
- conserver précédent, lecture/pause et suivant dans le mini-player mobile ;
- porter les cibles tactiles interactives à 44 px minimum ;
- améliorer la lisibilité des libellés et métadonnées ;
- rendre les dialogues utilisables au clavier et par lecteur d’écran ;
- accélérer l’affichage des longues listes de sourates et d’ayat ;
- harmoniser les états de focus, chargement, succès et thème système.

## Hors périmètre

- nouveau catalogue média ;
- authentification, téléchargements ou recommandations ;
- modification de la logique audio, du Tajwid ou du karaoké ;
- nouvelle direction artistique.

## Critères d’acceptation

1. Aucun défilement horizontal entre 320 px et 1440 px.
2. Les commandes essentielles du mini-player restent visibles à 320 px.
3. Les contrôles tactiles principaux font au moins 44 × 44 px.
4. Les dialogues piègent le focus, se ferment avec Échap et rendent le focus au déclencheur.
5. Une note modifiée ne peut pas être fermée accidentellement sans avertissement.
6. Un lien d’évitement permet d’atteindre directement le contenu principal.
7. Les champs ont un nom, un type et une aide de saisie adaptés.
8. Les listes longues utilisent une stratégie de rendu progressif sans changer leur contenu.
9. Les quatre thèmes conservent leurs couleurs sémantiques et mettent à jour la couleur du navigateur.
10. Le build, le lint et une vérification mobile/desktop sont réussis avant publication.
