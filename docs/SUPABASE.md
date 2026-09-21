# Backend Supabase RIHLA

Le dépôt contient la fondation Supabase dans `supabase/` : configuration locale, migration versionnée, schéma PostgreSQL, index, RLS, droits Data API et bucket Storage privé.

## Configuration

Copier `.env.example` vers `.env.local` et renseigner uniquement :

- `NEXT_PUBLIC_SUPABASE_URL` ;
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

La clé `service_role` ne doit jamais être mise dans le navigateur, dans `.env.example`, dans GitHub ou dans une variable `NEXT_PUBLIC_*`. Le client navigateur et le client serveur sont dans `lib/supabase/browser.ts` et `lib/supabase/server.ts`.

## Migrations et types

Après création du projet Supabase dev :

```text
supabase link --project-ref <ref-dev>
supabase db push
supabase gen types typescript --linked --schema public > lib/supabase/database.types.ts
```

Le projet de production doit avoir un autre `project-ref`. Les sauvegardes, la rétention et les alertes se configurent dans le tableau de bord du projet hébergé ; aucun secret ou identifiant distant n'est inventé dans le dépôt.

La migration crée les agrégats du catalogue et les tables privées nécessaires aux favoris, marque-pages, notes, playlists, progressions, préférences, abonnements, téléchargements, rapports et événements de synchronisation.

## Comptes

`components/account-panel.tsx` garde un mode invité sans variables Supabase et utilise Auth email/mot de passe lorsqu'un projet est configuré. L'inscription crée le profil privé puis envoie le snapshot local comme événement `local_library` une seule fois par utilisateur et par appareil. La récupération de mot de passe redirige vers le panneau Réglages pour permettre le changement du mot de passe.

La suppression du compte passe par `supabase/functions/delete-account`. Déployer cette fonction avec `supabase functions deploy delete-account` et conserver `SUPABASE_SERVICE_ROLE_KEY` uniquement dans les secrets Edge Function du projet. Cette clé n'est jamais incluse dans le client web.

## Sécurité

- Toutes les tables du schéma `public` ont RLS activé.
- Le catalogue est lisible publiquement uniquement lorsqu'un contenu est `PUBLISHED`.
- Les tables utilisateur exigent `auth.uid() = user_id` ; les lignes de playlist sont protégées par le propriétaire de la playlist.
- Les écritures de catalogue ne sont pas accordées aux rôles Data API publics ; elles passent par l'import/back-office privilégié à venir.
- Le bucket `user-media` est privé et exige un chemin de premier niveau égal à l'UUID utilisateur pour lire, déposer, modifier ou supprimer.
- Les politiques `UPDATE` possèdent `USING` et `WITH CHECK` afin d'empêcher une réaffectation de propriétaire.

La migration a été exécutée avec succès dans un PostgreSQL 18 temporaire en reproduisant les objets minimaux `auth`/`storage`. La validation Supabase locale complète (`supabase db lint --local`, `supabase gen types --local`) nécessite Docker Desktop ; elle devra être rejouée dans l'environnement de développement Supabase avant le premier `db push` distant.
