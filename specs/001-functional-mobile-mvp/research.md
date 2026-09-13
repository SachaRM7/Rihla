# Research: MVP Coran fonctionnel et mobile

## 1. Source Coran

**Decision**: utiliser Al Quran Cloud comme adaptateur de données public pour ce MVP.

**Rationale**: Quran Foundation est la cible recommandée à terme, mais son API actuelle requiert un flux OAuth client credentials côté serveur, ainsi que des en-têtes d’identification. Aucun secret de projet n’est disponible. Al Quran Cloud documente une API REST publique pour les sourates, éditions, textes et audio, ainsi qu’un CDN de streaming.

**Alternatives considered**:

- Quran Foundation directement : écarté pour cet incrément faute d’identifiants ; l’adaptateur interne permettra une migration.
- Données statiques embarquées : écartées car elles recréeraient une maquette et compliqueraient l’attribution.
- Scraping : écarté pour fiabilité et conformité.

**References**:

- https://api-docs.quran.com/docs/quickstart/
- https://api-docs.quran.com/docs/quickstart/first-api-call/
- https://alquran.cloud/api
- https://alquran.cloud/cdn
- https://alquran.cloud/terms-and-conditions

## 2. Editions et récitateurs

**Decision**: allowlist courte côté serveur, avec `ar.alafasy` par défaut et deux éditions audio supplémentaires vérifiées par l’API.

**Rationale**: empêcher l’injection d’un identifiant d’édition arbitraire et garantir que chaque option exposée produit des ayat avec URL audio.

**Alternatives considered**:

- Liste complète dynamique : plus fragile pour un MVP et expose des éditions incompatibles.
- Un seul récitant : fonctionnel mais ne respecte pas l’exigence de choix.

## 3. Lecture et synchronisation

**Decision**: un seul élément `HTMLAudioElement` persistant, associé à l’URL de l’ayah active.

**Rationale**: la source fournit un fichier par ayah. Les événements natifs `loadedmetadata`, `timeupdate`, `play`, `pause`, `ended` et `error` donnent une progression réelle, permettent le seek et déclenchent l’auto-avance.

**Alternatives considered**:

- Chronomètre applicatif : rejeté, car faux et désynchronisé.
- Audio sourate complète avec timestamps : plus complexe et non nécessaire pour la première tranche.
- Web Audio API : puissance inutile pour ce besoin.

## 4. Persistance

**Decision**: un document JSON versionné dans localStorage, lu de façon défensive.

**Rationale**: il couvre reprise et favoris sans imposer d’authentification ou de backend. Les erreurs de parsing et d’écriture sont capturées pour que l’écoute reste fonctionnelle.

**Alternatives considered**:

- Supabase immédiatement : hors périmètre de cette tranche et demanderait configuration/auth.
- IndexedDB : utile pour offline volumineux, excessif pour quelques identifiants.

## 5. Mobile et accessibilité

**Decision**: shell mobile-first, contenu en une colonne, navigation et mini-player fixes avec safe-area, targets de 44 px, desktop enrichi via media queries.

**Rationale**: l’écoute est principalement mobile et les actions fréquentes doivent être utilisables au pouce.

**Alternatives considered**:

- Réduire la maquette desktop : rejeté, car les priorités et zones fixes restent mauvaises.
- Dupliquer les écrans mobile/desktop : rejeté pour maintenir une seule logique accessible.

## 6. Contenus non branchés

**Decision**: afficher un état « bientôt disponible » informatif pour podcasts, vidéos et conférences.

**Rationale**: aucun catalogue licencié n’est configuré. Une carte avec faux bouton de lecture violerait la spécification et la confiance utilisateur.
