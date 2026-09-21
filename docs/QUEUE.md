# File d’attente universelle

La file persistée dans `LocalLibrary.playbackQueue` accepte les deux familles `QURAN` et `SPOKEN`. Chaque entrée conserve son URL média, sa référence Quran ou son `contentId`, son ordre et sa date d’ajout.

- « Ajouter à la file » ajoute en fin ; « Lire ensuite » insère après l’élément courant ou en tête si rien ne joue.
- Une entrée devient courante lorsqu’elle est lancée depuis la bibliothèque et reste visible après réorganisation.
- La fin d’un contenu retire l’entrée terminée puis lance la suivante. Un passage Coran ↔ parlé demande une confirmation tant que la préférence d’auto-avance inter-familles n’est pas activée.
- Une référence Quran ou un contenu parlé devenu introuvable est retiré avec un message explicite ; les autres entrées restent intactes.
- La queue reste locale en mode invité et est incluse dans le snapshot Supabase privé lorsqu’un compte est connecté.
