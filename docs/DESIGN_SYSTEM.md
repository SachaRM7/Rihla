# Design system RIHLA — Phase 6

## Direction

RIHLA conserve une identité sombre, ivoire et olive, mais ne doit pas ressembler à une succession de grandes cartes. La composition alterne listes, rails, texte libre, surfaces compactes, panneaux et espaces de lecture.

## Densité

- Le contenu utile apparaît dans le premier viewport.
- Les titres de page sont compacts.
- Les paragraphes de présentation sont rares.
- Les actions d’écoute apparaissent près du contenu, jamais après une longue introduction.
- Les touch targets restent au minimum à 44 px.

## Couleurs sémantiques

Les thèmes et accents sont séparés.

### Apparence
- dark
- light
- system

### Accent
- olive par défaut
- variantes futures indépendantes de l’apparence

### Sémantique
- text-primary
- text-secondary à contraste renforcé
- surface-1
- surface-2
- border
- accent
- danger
- success

Les couleurs de tajwid sont fixes et ne dérivent jamais de l’accent utilisateur.

## Typographie

Trois rôles :
- UI sans-serif : navigation, métadonnées, contrôles ;
- éditorial : titres ponctuels, sans grands hero marketing ;
- arabe : police dédiée avec line-height généreux.

Tailles arabe et traduction sont réglables séparément.

## Rayons

Éviter un rayon unique partout.
- petits contrôles : 10–12
- lignes/listes : 12–14
- panneaux : 16–20
- artwork : selon composition

Les sections peuvent aussi être sans carte ni bordure.

## Élévation

Réservée à :
- mini-player ;
- player complet ;
- menus/popovers ;
- éléments flottants.

Les cartes de catalogue ne doivent pas toutes avoir une grosse ombre.

## États

Tout contrôle interactif prévoit :
- default
- hover
- pressed
- focus-visible
- disabled
- loading
- error

L’état n’est jamais communiqué uniquement par couleur.

## Composants fondamentaux

Avant les écrans :
- AppHeader
- BottomNavigation / DesktopNavigation
- MiniPlayer
- MediaRow
- MediaArtwork
- SectionHeader
- SearchField
- FilterChip
- EmptyState
- ErrorState
- LoadingState
- IconButton
- PrimaryButton
- SecondaryButton
- ContextMenu
- ProgressIndicator

Coran :
- SurahRow
- AyahBlock
- QuranText
- TranslationBlock
- ReciterSelector
- QuranProgress

## Règles de composition

Accueil : reprise dominante + accès rapides + rails courts.

Recherche : champ immédiatement visible, puis suggestions/résultats.

Coran : catalogue et lecture ; sur desktop les deux peuvent coexister.

Bibliothèque : listes d’usages, pas dashboard de compteurs.

Player : surface immersive dédiée, sans navigation catalogue concurrente.

## Safe areas

Le shell calcule explicitement l’espace occupé par :
- header ;
- navigation ;
- mini-player ;
- safe-area OS.

Aucun bouton, verset ou dernier résultat ne doit finir sous une surface persistante.

## Accessibilité

- contraste WCAG visé pour les textes ;
- focus visible ;
- labels accessibles ;
- taille de texte adaptable ;
- prefers-reduced-motion ;
- RTL correct ;
- états doublés par icône/texte/ARIA.

## Dépendance suivante

Le design system étant défini, la Phase 7 peut maintenant refondre les écrans fondamentaux dans cet ordre :
1. shell/navigation persistante ;
2. Accueil ;
3. Coran ;
4. Recherche ;
5. Bibliothèque ;
6. Réglages ;
7. Player complet.

Chaque écran doit réutiliser les contrats de domaine et de playback déjà définis.
