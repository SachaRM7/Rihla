# Data Model: MVP Coran fonctionnel et mobile

## SurahSummary

| Field | Type | Rules |
|---|---|---|
| number | number | entier 1–114, identifiant |
| name | string | nom arabe fourni par la source |
| englishName | string | translittération source |
| frenchName | string | nom traduit affiché |
| revelationType | "Meccan" \| "Medinan" | valeur source validée |
| numberOfAyahs | number | entier positif |

## AyahPlayback

| Field | Type | Rules |
|---|---|---|
| number | number | numéro global |
| numberInSurah | number | entier positif |
| arabicText | string | texte source, jamais transformé |
| frenchText | string | traduction séparée |
| audioUrl | string | URL HTTPS de streaming |

## SurahDetail

| Field | Type | Rules |
|---|---|---|
| surah | SurahSummary | métadonnées |
| reciterId | string | membre de l’allowlist |
| reciterName | string | libellé humain |
| ayahs | AyahPlayback[] | ordre croissant, non vide |
| source | SourceAttribution | visible dans l’interface |

## Reciter

| Field | Type | Rules |
|---|---|---|
| id | string | identifiant d’édition API allowlisté |
| name | string | nom affiché |
| bitrate | number | kbps si connu |

## LocalLibraryV1

| Field | Type | Default |
|---|---|---|
| version | 1 | 1 |
| favoriteSurahs | number[] | [] |
| favoriteAyahs | string[] | [] ; clé `surah:ayah` |
| lastSurah | number | 1 |
| lastAyah | number | 1 |
| reciterId | string | ar.alafasy |

### Invariants

- Les favoris sont dédupliqués.
- `lastSurah` est ramené à 1 si hors de 1–114.
- `lastAyah` est ramené à 1 si absent ou hors de la sourate chargée.
- Un document local d’une version inconnue est ignoré sans bloquer l’application.

## PlaybackState

| Field | Type | Description |
|---|---|---|
| status | idle \| loading \| ready \| playing \| paused \| error | état observable |
| currentTime | number | secondes réelles |
| duration | number | secondes réelles |
| error | string \| null | message utilisateur |
| activeAyahIndex | number | index dans la sourate chargée |

### State transitions

```text
idle -> loading -> ready -> playing <-> paused
                   |          |
                   +-> error <-+
playing --ended--> loading(next ayah) -> playing
```
