# Spécification — Notes personnelles par ayah

## Objectif

Permettre à l’utilisateur d’écrire, modifier et supprimer une note privée associée à une ayah, puis de retrouver ses notes dans la bibliothèque et de rouvrir directement le passage concerné.

## Exigences

- Une note appartient à une référence `sourate:ayah` et reste distincte du texte coranique et de la traduction.
- L’ouverture de l’éditeur ne doit pas déclencher la lecture de l’ayah.
- Une note vide équivaut à une suppression.
- Les notes sont enregistrées localement de façon défensive dans la version actuelle du produit.
- La bibliothèque affiche les notes de la plus récente à la plus ancienne.
- Un clic sur une note ouvre la bonne ayah sans lecture automatique.
- L’interface reste utilisable sur un écran de 320 px.

## Hors périmètre

- Synchronisation multi-appareil et compte utilisateur.
- Notes publiques ou collaboratives.
- Export de notes.
