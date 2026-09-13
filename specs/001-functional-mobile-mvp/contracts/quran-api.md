# Contract: Quran API interne

Base path: `/api/quran`

## GET /surahs

Retourne le catalogue normalisé.

### Success 200

```json
{
  "data": [
    {
      "number": 1,
      "name": "سُورَةُ ٱلْفَاتِحَةِ",
      "englishName": "Al-Faatiha",
      "frenchName": "L'ouverture",
      "revelationType": "Meccan",
      "numberOfAyahs": 7
    }
  ],
  "source": {
    "name": "Al Quran Cloud",
    "url": "https://alquran.cloud"
  }
}
```

### Failure 502

```json
{ "error": "Le catalogue du Coran est momentanément indisponible." }
```

## GET /surah/:number?reciter=:id

`:number` doit être un entier de 1 à 114. `reciter` est optionnel et doit appartenir à l’allowlist.

### Success 200

```json
{
  "data": {
    "surah": {
      "number": 1,
      "name": "سُورَةُ ٱلْفَاتِحَةِ",
      "englishName": "Al-Faatiha",
      "frenchName": "L'ouverture",
      "revelationType": "Meccan",
      "numberOfAyahs": 7
    },
    "reciterId": "ar.alafasy",
    "reciterName": "Mishary Rashid Alafasy",
    "ayahs": [
      {
        "number": 1,
        "numberInSurah": 1,
        "arabicText": "بِسْمِ ...",
        "frenchText": "Au nom d’Allah...",
        "audioUrl": "https://..."
      }
    ],
    "source": {
      "name": "Al Quran Cloud / Islamic Network CDN",
      "url": "https://alquran.cloud"
    }
  }
}
```

### Failure 400

```json
{ "error": "Sourate ou récitant invalide." }
```

### Failure 502

```json
{ "error": "Cette sourate est momentanément indisponible." }
```

## Server rules

- Timeout en amont.
- Validation structurelle avant réponse.
- Cache HTTP public modéré pour les données immuables.
- Aucun paramètre client n’est interpolé dans une URL distante sans validation.
- Les URL audio restent celles de la source.
