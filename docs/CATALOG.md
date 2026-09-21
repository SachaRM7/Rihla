# Catalogue parlé — provenance et publication

Le catalogue parlé de RIHLA ne publie pas de contenu fictif. Chaque entrée publiée possède une notice source, un média identifié, une décision de droits, une attribution, une durée et une empreinte du fichier.

## Première sélection publiée

La sélection actuelle contient quatre extraits audio réutilisables déclarés domaine public ou CC0 dans leurs notices Internet Archive :

- [The Meaning of the Glorious Koran — notice Internet Archive](https://archive.org/details/meaning_glorious_koran_0810_librivox), enregistrement LibriVox d'une traduction anglaise de Mohammed Marmaduke Pickthall ;
- [The Moors in Spain — notice Internet Archive](https://archive.org/details/moorsinspain_1805_librivox), récit historique de Stanley Lane-Poole enregistré par LibriVox ;
- [Personal Narrative of a Pilgrimage to Al-Madinah and Meccah — notice Internet Archive](https://archive.org/details/pilgrimage_madinah_meccah_1207_librivox), récit de Richard Francis Burton enregistré par LibriVox ;
- [Kimiya-e-Saadat Urdu — notice Internet Archive](https://archive.org/details/Kimiya-e-saadatUrduByImamGhazali), extrait audio en ourdou attribué à Imam Ghazali.

Les médias sont diffusés depuis leur source distante. RIHLA ne les recopie pas dans son dépôt. Les URL de fichiers, tailles, durées et SHA-1 sont conservés dans `lib/spoken-catalog.ts` pour détecter une modification de la ressource source.

## Garde de publication

`publicContents()` ne retourne que les contenus `PUBLISHED` dont :

- la source et les créateurs existent ;
- chaque média possède une URL, un type MIME, une durée et un enregistrement de droits ;
- le streaming ou l'intégration est autorisé ;
- la vérification des droits est humaine ou partenaire ;
- l'usage commercial n'est pas inconnu et les droits n'ont pas été révoqués.

Une entrée retirée reste conservée avec le statut `UNAVAILABLE` ou `ARCHIVED`. Une révocation de droits renseigne `revokedAt` et la fait sortir immédiatement du catalogue public.

## Attribution

Les titres, auteurs et sources affichés par l'interface viennent des notices source. Une traduction, une transcription ou un tafsir ne doit jamais être présenté comme le texte coranique canonique. Les prochains cours, rappels, podcasts et vidéos doivent passer par la même revue individuelle avant de recevoir le statut `PUBLISHED`.
