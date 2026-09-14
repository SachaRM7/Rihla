# RIHLA — Design system maître

Ce document traduit la boîte à outils globale `C:\Users\SachaRbone\.codex\RESSOURCES.md` en règles de production propres à RIHLA. Il doit être relu avec ce fichier global avant chaque nouveau lot UI/UX.

## Direction

- Produit mobile-first de lecture, d’écoute et d’apprentissage : sombre, calme, premium, immersif et centré sur le contenu.
- Familiarité des grands players audio sans reprendre leur identité, leurs assets ni une composition pixel-perfect.
- Une seule grammaire visuelle pour le Coran, l’audio, la vidéo et les transcriptions : média actif, progression, texte synchronisé, actions secondaires.
- Priorité absolue à la lisibilité du texte arabe, de la traduction et des états de lecture.

## Sources de référence

Choisir les références selon le lot, puis n’en retenir que les principes utiles :

- Appshots, ScreensDesign et Refero : écran mobile et composants d’écoute.
- Pageflows : onboarding, authentification, abonnement et parcours multi-écrans.
- Component Gallery et Design Systems One : variantes de composants réels et cohérence des tokens.
- UI Skills et Interfaces by Rauno : audit, micro-détails et polish.
- Utopia et Open Props : échelles fluides et valeurs systématiques.
- Motion Primitives ou Kinetics : uniquement lorsqu’une animation sert la compréhension.

## Tokens et thèmes

- Toujours utiliser les variables sémantiques existantes (`--ink`, `--surface`, `--ivory`, `--muted`, `--accent`, `--danger`, etc.).
- Les thèmes olive, rose, orange et violet changent l’accent et les surfaces, jamais la signification d’une donnée.
- Les références numériques, compteurs et numéros d’ayat restent neutres et lisibles.
- Les couleurs de tajwid restent stables dans tous les thèmes, car elles portent une information linguistique.
- Aucun hexadécimal ad hoc dans un composant sauf couleur canonique documentée.

## Typographie

- Texte d’interface courant : 16 px lorsque la saisie ou la lecture prolongée l’exige ; 12 px minimum pour les libellés secondaires.
- Corps et traductions : interligne 1,5 à 1,75 et largeur de lecture contrôlée.
- Arabe : police dédiée, direction RTL explicite et taille généreuse.
- Timers et positions : chiffres tabulaires ou monospace pour éviter les sauts de mise en page.
- Hiérarchie par taille, poids, espace et contraste ; jamais par couleur seule.

## Grille et densité

- Échelle d’espacement 4/8 px ; niveaux principaux 8, 16, 24, 32 et 48 px.
- Gouttière mobile 16 px, 12 px seulement sous 360 px ; augmentation progressive sur tablette et desktop.
- Cibles tactiles de 44 × 44 px minimum et au moins 8 px entre actions voisines.
- Aucun défilement horizontal involontaire à partir de 320 px.
- Tout contenu scrollable réserve l’espace du mini-player, de la navigation et des safe areas.

## Composants et états

- Lucide est la famille d’icônes unique ; une icône seule reçoit toujours un nom accessible.
- Une surface interactive possède des états repos, pressé, focus clavier, actif et désactivé sans déplacer le layout.
- Une seule action primaire par panneau ; les options avancées utilisent la divulgation progressive.
- Les actions destructives sont séparées, nommées et confirmées.
- Les états vides expliquent la prochaine action possible.
- Les changements persistants sont confirmés par un toast non bloquant et accessible.

## Players et texte synchronisé

- Le mini-player conserve en priorité : contexte, ayah/titre, temps, précédent, lecture/pause et suivant selon l’espace.
- Le player agrandi regroupe les contrôles fréquents avant les options avancées.
- Le karaoké distingue clairement passé, actif et futur ; les ayat futures ne doivent jamais sembler déjà lues.
- La traduction peut être affichée ou masquée depuis l’ayah active sans remontée dans la page.
- Toute boucle, répétition ou minuterie affiche son état en texte en plus de la couleur.

## Motion

- Micro-interactions de 150 à 300 ms, principalement via `opacity` et `transform`.
- Une animation doit expliquer une ouverture, une fermeture, un changement d’état ou une progression.
- `prefers-reduced-motion` désactive les mouvements non essentiels.
- Aucun effet décoratif ne doit ralentir le démarrage audio ou le scroll du texte.

## Accessibilité et responsive

- Contraste WCAG AA : 4,5:1 pour le texte courant, 3:1 pour les grands glyphes et textes secondaires significatifs.
- Focus visible, ordre DOM logique, labels persistants et attributs `aria-*` reflétant l’état.
- Zoom navigateur conservé ; aucune action ne dépend uniquement du survol ou d’un geste.
- Vérification minimale à 320, 375, 768 et 1024 px, portrait et paysage pour les écrans structurants.
- Le texte dynamique doit pouvoir s’agrandir sans masquer les actions critiques.

## Porte de qualité avant publication

1. Relire le `RESSOURCES.md` global, le `RESSOURCES.md` du dépôt et ce document.
2. Identifier le type d’écran/parcours et sélectionner les références pertinentes.
3. Vérifier hiérarchie, densité, touch targets, feedback, focus, contraste et safe areas.
4. Contrôler les quatre thèmes et le mode de mouvement réduit par raisonnement ou test proportionné.
5. Construire une seule fois après convergence, publier, puis seulement démarrer le lot suivant.
