# Quickstart: MVP Coran fonctionnel et mobile

## Pré-requis

- Node.js 22.13 ou plus récent.
- Dépendances déjà installées dans `D:\plateforme-islamique\node_modules`.
- Accès réseau aux domaines `api.alquran.cloud` et `cdn.islamic.network`.

## Lancer

```powershell
Set-Location D:\plateforme-islamique
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

## Vérifier

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run lint
& 'C:\Program Files\nodejs\npm.cmd' run build
```

## Parcours fonctionnel

1. Ouvrir l’accueil et vérifier que le catalogue indique 114 sourates.
2. Choisir Al-Fatiha et lancer une ayah.
3. Vérifier play/pause, seek, précédent, suivant et auto-avance.
4. Ouvrir le texte Coran et sélectionner une ayah.
5. Ajouter la sourate et une ayah aux favoris.
6. Recharger la page et vérifier reprise/favoris.
7. Rechercher une sourate par nom ou numéro.
8. Couper la source réseau ou provoquer une URL invalide et vérifier l’état d’erreur.
9. Vérifier 320, 360, 390 et 430 px sans overflow horizontal.
10. Naviguer au clavier et contrôler les libellés accessibles.

## Publication

Après validation, créer une nouvelle version du site privé existant puis vérifier l’URL hébergée exacte. Ne pas présenter localhost comme livrable.
