# Feature Specification: Recherche Coran et historique d’écoute

**Status**: Ready  
**Scope**: Prochain incrément fonctionnel après le MVP Coran.

## User stories

### US1 — Rechercher dans le Coran (P1)

L’utilisateur peut rechercher un mot dans la traduction française ou saisir une référence `sourate:ayah`, puis ouvrir directement l’ayah correspondante.

**Acceptance**:

- Les résultats proviennent de la source Coran réelle et affichent la référence, la sourate et le passage français.
- Un clic ouvre la bonne sourate et la bonne ayah.
- Les états attente, chargement, vide et erreur sont explicites.
- Les requêtes trop courtes ou anormalement longues ne sont pas envoyées à la source.

### US2 — Reprendre exactement l’écoute (P1)

L’utilisateur retrouve la dernière ayah au temps enregistré, et pas seulement au début du verset.

**Acceptance**:

- La position est enregistrée périodiquement pendant la lecture et immédiatement à la pause.
- Au rechargement ou depuis l’historique, la piste est positionnée au temps sauvegardé.
- Une donnée locale ancienne ou corrompue ne bloque jamais la lecture.

### US3 — Consulter l’historique (P2)

L’utilisateur voit ses écoutes récentes dans la bibliothèque avec leur progression et peut les reprendre.

**Acceptance**:

- L’historique contient au plus 24 ayat récentes, sans doublon par ayah.
- Chaque entrée affiche sourate, ayah, temps atteint et progression.
- Un clic reprend l’ayah au bon timestamp.

## Constraints

- Conserver la stack, l’identité, la navigation et le stockage local existants.
- Ne pas introduire de faux contenu ni de dépendance supplémentaire.
- Garder les cibles tactiles et la mise en page mobile utilisables dès 320 px.

