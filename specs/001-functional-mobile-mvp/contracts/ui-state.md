# Contract: UI et état local

## Navigation

- `Accueil`: reprise immédiate et accès au catalogue.
- `Rechercher`: filtre le catalogue réel.
- `Coran`: liste complète et vue d’ayah.
- `Bibliothèque`: favoris réellement persistés ; catégories non branchées clairement signalées.

La navigation ne détruit pas l’élément audio ni son état.

## Player

- Le mini-player apparaît dès qu’une sourate est chargée.
- Un tap sur son corps ouvre le player complet.
- Play/pause reflète l’événement audio, pas une valeur anticipée.
- Seek est désactivé avant une durée valide.
- Précédent/suivant naviguent dans les ayat.
- La fin d’une ayah sélectionne automatiquement la suivante et tente la lecture uniquement à la suite d’une lecture initiée par l’utilisateur.
- Toute erreur audio expose un message et une action « Réessayer ».

## Ayah list

- La ligne active utilise `aria-current="true"`.
- Le texte arabe porte `lang="ar"`, `dir="rtl"` et `translate="no"`.
- Le bouton d’ayah possède un libellé incluant sourate et numéro.
- Le favori ne déclenche pas le seek par propagation.

## Local storage

Key: `rihla.library.v1`

```json
{
  "version": 1,
  "favoriteSurahs": [1],
  "favoriteAyahs": ["1:1"],
  "lastSurah": 1,
  "lastAyah": 1,
  "reciterId": "ar.alafasy"
}
```

Le chargement et l’écriture sont entourés d’un traitement d’erreur. Un échec de stockage ne bloque pas la session.

## Mobile constraints

- Largeur de référence minimale : 320 px.
- Aucun élément fixe plus large que le viewport.
- Les panneaux tiennent compte de `env(safe-area-inset-bottom)`.
- La zone de contenu réserve l’espace combiné de la navigation et du mini-player.
- Les éléments textuels peuvent rétrécir avec `min-width: 0`.
