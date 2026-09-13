# Feature Specification: Outils d’étude du Coran

**Status**: Ready

## User stories

### US1 — Répéter une ayah pour mémoriser (P1)

L’utilisateur choisit une répétition désactivée, 3×, 5×, 10× ou continue. Le player rejoue l’ayah exactement le nombre demandé avant de poursuivre.

### US2 — Adapter la lecture (P1)

L’utilisateur peut masquer la traduction française pour se concentrer sur l’arabe, puis la réafficher sans perdre sa position.

### US3 — Partager une ayah (P1)

L’utilisateur peut partager une ayah depuis la liste ou le player. Le lien obtenu ouvre la bonne sourate, la bonne ayah et, si présent, le timestamp de la récitation.

## Acceptance criteria

- Le compteur de répétition est visible pendant une boucle bornée et revient à zéro lors d’un changement d’ayah.
- La préférence d’affichage de la traduction est conservée sur l’appareil.
- Les paramètres d’URL `surah`, `ayah` et `t` sont validés avant usage.
- Le partage utilise la feuille native quand elle existe et copie sinon le lien dans le presse-papiers.
- Un retour bref confirme que le lien a été copié.
- Les nouveaux contrôles restent utilisables au clavier et sur mobile.

