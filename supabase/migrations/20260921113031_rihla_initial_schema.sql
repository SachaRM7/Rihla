-- RIHLA backend foundation.
-- Public catalog rows are read-only for clients; user data is private by owner.
-- The service_role is intentionally not used by browser code.

create extension if not exists pgcrypto;

create schema if not exists private;

create type public.catalog_editorial_status as enum (
  'DRAFT',
  'RIGHTS_REVIEW',
  'METADATA_REVIEW',
  'READY',
  'PUBLISHED',
  'RIGHTS_REJECTED',
  'UNAVAILABLE',
  'ARCHIVED'
);

create type public.rights_verification as enum (
  'UNVERIFIED',
  'AUTO_DETECTED',
  'HUMAN_VERIFIED',
  'PARTNER_VERIFIED'
);

create type public.user_target_type as enum ('CREATOR', 'SERIES');
create type public.playlist_item_type as enum ('QURAN_AYAH', 'CONTENT');
create type public.report_status as enum ('OPEN', 'RESOLVED', 'DISMISSED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 120),
  avatar_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.catalog_sources (
  id text primary key,
  name text not null check (char_length(name) between 1 and 240),
  original_url text not null check (original_url ~* '^https?://'),
  publisher text,
  accessed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.catalog_rights (
  id text primary key,
  source_id text not null references public.catalog_sources(id) on delete restrict,
  rights_holder text,
  license_type text,
  license_version text,
  license_url text check (license_url is null or license_url ~* '^https?://'),
  attribution_text text,
  evidence_url text check (evidence_url is null or evidence_url ~* '^https?://'),
  verified_at timestamptz,
  verification public.rights_verification not null default 'UNVERIFIED',
  display_metadata text not null default 'UNKNOWN' check (display_metadata in ('YES', 'NO', 'UNKNOWN', 'CONDITIONAL')),
  embed text not null default 'UNKNOWN' check (embed in ('YES', 'NO', 'UNKNOWN', 'CONDITIONAL')),
  stream_remote text not null default 'UNKNOWN' check (stream_remote in ('YES', 'NO', 'UNKNOWN', 'CONDITIONAL')),
  host_copy text not null default 'UNKNOWN' check (host_copy in ('YES', 'NO', 'UNKNOWN', 'CONDITIONAL')),
  download_offline text not null default 'UNKNOWN' check (download_offline in ('YES', 'NO', 'UNKNOWN', 'CONDITIONAL')),
  transcribe text not null default 'UNKNOWN' check (transcribe in ('YES', 'NO', 'UNKNOWN', 'CONDITIONAL')),
  translate text not null default 'UNKNOWN' check (translate in ('YES', 'NO', 'UNKNOWN', 'CONDITIONAL')),
  create_chapters text not null default 'UNKNOWN' check (create_chapters in ('YES', 'NO', 'UNKNOWN', 'CONDITIONAL')),
  create_clips text not null default 'UNKNOWN' check (create_clips in ('YES', 'NO', 'UNKNOWN', 'CONDITIONAL')),
  modify text not null default 'UNKNOWN' check (modify in ('YES', 'NO', 'UNKNOWN', 'CONDITIONAL')),
  commercial_use text not null default 'UNKNOWN' check (commercial_use in ('YES', 'NO', 'UNKNOWN', 'CONDITIONAL')),
  review_notes text,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.catalog_topics (
  id text primary key,
  slug text not null unique,
  label text not null
);

create table public.catalog_creators (
  id text primary key,
  slug text not null unique,
  name text not null,
  languages text[] not null default '{}',
  roles text[] not null default '{}',
  official_urls text[] not null default '{}'
);

create table public.catalog_series (
  id text primary key,
  slug text not null unique,
  title text not null,
  description text
);

create table public.catalog_media_assets (
  id text primary key,
  kind text not null check (kind in ('AUDIO', 'VIDEO')),
  url text not null check (url ~* '^https?://'),
  duration_ms bigint check (duration_ms is null or duration_ms > 0),
  source_id text not null references public.catalog_sources(id) on delete restrict,
  rights_record_id text not null references public.catalog_rights(id) on delete restrict,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  checksum_sha1 text check (checksum_sha1 is null or checksum_sha1 ~* '^[0-9a-f]{40}$'),
  source_file_name text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.catalog_media_variants (
  id text primary key,
  media_asset_id text not null references public.catalog_media_assets(id) on delete cascade,
  kind text not null check (kind in ('AUDIO', 'VIDEO')),
  url text not null check (url ~* '^https?://'),
  quality text check (quality is null or quality in ('DATA_SAVER', 'STANDARD', 'HIGH')),
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  checksum_sha1 text check (checksum_sha1 is null or checksum_sha1 ~* '^[0-9a-f]{40}$'),
  unique (media_asset_id, quality, url)
);

create table public.catalog_contents (
  id text primary key,
  slug text not null unique,
  type text not null check (type in ('REMINDER', 'COURSE', 'LECTURE', 'INTERVIEW', 'PODCAST_EPISODE', 'VIDEO', 'AUDIOBOOK')),
  title text not null check (char_length(title) between 1 and 300),
  description text,
  language text not null check (language in ('fr', 'ar', 'en', 'ur')),
  level text check (level is null or level in ('DISCOVERY', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
  status public.catalog_editorial_status not null default 'DRAFT',
  series_id text references public.catalog_series(id) on delete set null,
  source_id text not null references public.catalog_sources(id) on delete restrict,
  artwork_url text check (artwork_url is null or artwork_url ~* '^https?://'),
  artwork_alt text,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.catalog_content_creators (
  content_id text not null references public.catalog_contents(id) on delete cascade,
  creator_id text not null references public.catalog_creators(id) on delete restrict,
  primary key (content_id, creator_id)
);

create table public.catalog_content_topics (
  content_id text not null references public.catalog_contents(id) on delete cascade,
  topic_id text not null references public.catalog_topics(id) on delete restrict,
  primary key (content_id, topic_id)
);

create table public.catalog_content_media (
  content_id text not null references public.catalog_contents(id) on delete cascade,
  media_asset_id text not null references public.catalog_media_assets(id) on delete restrict,
  position integer not null default 1 check (position > 0),
  primary key (content_id, media_asset_id),
  unique (content_id, position)
);

create table public.catalog_collections (
  id text primary key,
  slug text not null unique,
  title text not null,
  description text,
  curator_name text not null
);

create table public.catalog_collection_items (
  collection_id text not null references public.catalog_collections(id) on delete cascade,
  content_id text not null references public.catalog_contents(id) on delete cascade,
  position integer not null default 1 check (position > 0),
  primary key (collection_id, content_id),
  unique (collection_id, position)
);

create table public.catalog_chapters (
  id text primary key,
  content_id text not null references public.catalog_contents(id) on delete cascade,
  title text not null,
  start_ms bigint not null check (start_ms >= 0),
  end_ms bigint check (end_ms is null or end_ms > start_ms),
  position integer not null check (position > 0),
  unique (content_id, position)
);

create table public.catalog_transcripts (
  id text primary key,
  content_id text not null references public.catalog_contents(id) on delete cascade,
  language text not null check (language in ('fr', 'ar', 'en', 'ur')),
  status text not null check (status in ('AUTOMATIC', 'CORRECTED', 'VALIDATED')),
  source_id text references public.catalog_sources(id) on delete set null
);

create table public.catalog_transcript_segments (
  id text primary key,
  transcript_id text not null references public.catalog_transcripts(id) on delete cascade,
  start_ms bigint not null check (start_ms >= 0),
  end_ms bigint not null check (end_ms > start_ms),
  text text not null,
  position integer not null check (position > 0),
  unique (transcript_id, position)
);

create table public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_kind text not null check (target_kind in ('QURAN_SURAH', 'QURAN_AYAH', 'CONTENT')),
  target_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, target_kind, target_id)
);

create table public.user_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_kind text not null check (target_kind in ('QURAN', 'MEDIA', 'TRANSCRIPT')),
  target_id text not null,
  position_ms bigint check (position_ms is null or position_ms >= 0),
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_kind text not null check (target_kind in ('QURAN_AYAH', 'CONTENT', 'TRANSCRIPT_SEGMENT')),
  target_id text not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, target_kind, target_id)
);

create table public.user_playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  allow_mixed_content boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.user_playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.user_playlists(id) on delete cascade,
  position integer not null check (position >= 0),
  item_type public.playlist_item_type not null,
  item_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (playlist_id, position)
);

create table public.user_playback_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  position_ms bigint not null default 0 check (position_ms >= 0),
  duration_ms bigint check (duration_ms is null or duration_ms >= 0),
  completed boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, content_id)
);

create table public.user_quran_reading_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  surah integer not null check (surah between 1 and 114),
  ayah integer not null check (ayah >= 1),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.user_quran_listening_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  recitation_id text not null,
  reference jsonb not null,
  position_ms bigint check (position_ms is null or position_ms >= 0),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, recitation_id)
);

create table public.user_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  preference_key text not null check (preference_key ~ '^[a-z0-9._-]{1,80}$'),
  value jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, preference_key)
);

create table public.user_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type public.user_target_type not null,
  target_id text not null,
  notify_new_publications boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, target_type, target_id)
);

create table public.user_downloads (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  media_asset_id text not null,
  transcript_id text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  quality text check (quality is null or quality in ('DATA_SAVER', 'STANDARD', 'HIGH')),
  status text not null check (status in ('QUEUED', 'DOWNLOADING', 'AVAILABLE', 'ERROR')),
  downloaded_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, media_asset_id)
);

create table public.user_sync_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null check (char_length(device_id) between 1 and 120),
  entity text not null check (char_length(entity) between 1 and 80),
  operation text not null check (operation in ('UPSERT', 'DELETE')),
  entity_id text not null,
  payload jsonb,
  client_updated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.user_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  kind text not null check (kind in ('TEXT', 'TIMING', 'SOURCE', 'UNAVAILABLE')),
  note text check (note is null or char_length(note) <= 2000),
  status public.report_status not null default 'OPEN',
  created_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz
);

create index catalog_contents_status_idx on public.catalog_contents(status);
create index catalog_contents_series_idx on public.catalog_contents(series_id);
create index catalog_content_media_media_idx on public.catalog_content_media(media_asset_id);
create index catalog_content_creators_creator_idx on public.catalog_content_creators(creator_id);
create index catalog_content_topics_topic_idx on public.catalog_content_topics(topic_id);
create index catalog_rights_source_idx on public.catalog_rights(source_id);
create index catalog_media_rights_idx on public.catalog_media_assets(rights_record_id);
create index user_sync_events_owner_created_idx on public.user_sync_events(user_id, created_at desc);
create index user_reports_content_idx on public.user_reports(content_id, created_at desc);
create index user_playlist_items_playlist_position_idx on public.user_playlist_items(playlist_id, position);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger catalog_contents_set_updated_at before update on public.catalog_contents for each row execute function private.set_updated_at();
create trigger user_bookmarks_set_updated_at before update on public.user_bookmarks for each row execute function private.set_updated_at();
create trigger user_notes_set_updated_at before update on public.user_notes for each row execute function private.set_updated_at();
create trigger user_playlists_set_updated_at before update on public.user_playlists for each row execute function private.set_updated_at();
create trigger user_playback_progress_set_updated_at before update on public.user_playback_progress for each row execute function private.set_updated_at();
create trigger user_quran_reading_progress_set_updated_at before update on public.user_quran_reading_progress for each row execute function private.set_updated_at();
create trigger user_quran_listening_progress_set_updated_at before update on public.user_quran_listening_progress for each row execute function private.set_updated_at();
create trigger user_preferences_set_updated_at before update on public.user_preferences for each row execute function private.set_updated_at();
create trigger user_downloads_set_updated_at before update on public.user_downloads for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.catalog_sources enable row level security;
alter table public.catalog_rights enable row level security;
alter table public.catalog_topics enable row level security;
alter table public.catalog_creators enable row level security;
alter table public.catalog_series enable row level security;
alter table public.catalog_media_assets enable row level security;
alter table public.catalog_media_variants enable row level security;
alter table public.catalog_contents enable row level security;
alter table public.catalog_content_creators enable row level security;
alter table public.catalog_content_topics enable row level security;
alter table public.catalog_content_media enable row level security;
alter table public.catalog_collections enable row level security;
alter table public.catalog_collection_items enable row level security;
alter table public.catalog_chapters enable row level security;
alter table public.catalog_transcripts enable row level security;
alter table public.catalog_transcript_segments enable row level security;
alter table public.user_favorites enable row level security;
alter table public.user_bookmarks enable row level security;
alter table public.user_notes enable row level security;
alter table public.user_playlists enable row level security;
alter table public.user_playlist_items enable row level security;
alter table public.user_playback_progress enable row level security;
alter table public.user_quran_reading_progress enable row level security;
alter table public.user_quran_listening_progress enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_follows enable row level security;
alter table public.user_downloads enable row level security;
alter table public.user_sync_events enable row level security;
alter table public.user_reports enable row level security;

create policy "published catalog sources are readable"
on public.catalog_sources for select to anon, authenticated using (exists (select 1 from public.catalog_contents content where content.source_id = catalog_sources.id and content.status = 'PUBLISHED'));
create policy "published rights are readable"
on public.catalog_rights for select to anon, authenticated using (exists (select 1 from public.catalog_media_assets media join public.catalog_content_media link on link.media_asset_id = media.id join public.catalog_contents content on content.id = link.content_id where media.rights_record_id = catalog_rights.id and content.status = 'PUBLISHED'));
create policy "published topics are readable"
on public.catalog_topics for select to anon, authenticated using (exists (select 1 from public.catalog_content_topics link join public.catalog_contents content on content.id = link.content_id where link.topic_id = catalog_topics.id and content.status = 'PUBLISHED'));
create policy "published creators are readable"
on public.catalog_creators for select to anon, authenticated using (exists (select 1 from public.catalog_content_creators link join public.catalog_contents content on content.id = link.content_id where link.creator_id = catalog_creators.id and content.status = 'PUBLISHED'));
create policy "published series are readable"
on public.catalog_series for select to anon, authenticated using (exists (select 1 from public.catalog_contents content where content.series_id = catalog_series.id and content.status = 'PUBLISHED'));
create policy "published media are readable"
on public.catalog_media_assets for select to anon, authenticated using (exists (select 1 from public.catalog_content_media link join public.catalog_contents content on content.id = link.content_id where link.media_asset_id = catalog_media_assets.id and content.status = 'PUBLISHED'));
create policy "published media variants are readable"
on public.catalog_media_variants for select to anon, authenticated using (exists (select 1 from public.catalog_media_assets media join public.catalog_content_media link on link.media_asset_id = media.id join public.catalog_contents content on content.id = link.content_id where media.id = catalog_media_variants.media_asset_id and content.status = 'PUBLISHED'));
create policy "published contents are readable"
on public.catalog_contents for select to anon, authenticated using (status = 'PUBLISHED');
create policy "published content creators are readable"
on public.catalog_content_creators for select to anon, authenticated using (exists (select 1 from public.catalog_contents content where content.id = catalog_content_creators.content_id and content.status = 'PUBLISHED'));
create policy "published content topics are readable"
on public.catalog_content_topics for select to anon, authenticated using (exists (select 1 from public.catalog_contents content where content.id = catalog_content_topics.content_id and content.status = 'PUBLISHED'));
create policy "published content media are readable"
on public.catalog_content_media for select to anon, authenticated using (exists (select 1 from public.catalog_contents content where content.id = catalog_content_media.content_id and content.status = 'PUBLISHED'));
create policy "published collections are readable"
on public.catalog_collections for select to anon, authenticated using (exists (select 1 from public.catalog_collection_items item join public.catalog_contents content on content.id = item.content_id where item.collection_id = catalog_collections.id and content.status = 'PUBLISHED'));
create policy "published collection items are readable"
on public.catalog_collection_items for select to anon, authenticated using (exists (select 1 from public.catalog_contents content where content.id = catalog_collection_items.content_id and content.status = 'PUBLISHED'));
create policy "published chapters are readable"
on public.catalog_chapters for select to anon, authenticated using (exists (select 1 from public.catalog_contents content where content.id = catalog_chapters.content_id and content.status = 'PUBLISHED'));
create policy "published transcripts are readable"
on public.catalog_transcripts for select to anon, authenticated using (exists (select 1 from public.catalog_contents content where content.id = catalog_transcripts.content_id and content.status = 'PUBLISHED'));
create policy "published transcript segments are readable"
on public.catalog_transcript_segments for select to anon, authenticated using (exists (select 1 from public.catalog_transcripts transcript join public.catalog_contents content on content.id = transcript.content_id where transcript.id = catalog_transcript_segments.transcript_id and content.status = 'PUBLISHED'));

create policy "profiles are private to their owner"
on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "users can create their profile"
on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "users can update their profile"
on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "users can delete their profile"
on public.profiles for delete to authenticated using ((select auth.uid()) = id);

create policy "owners can read favorites" on public.user_favorites for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners can insert favorites" on public.user_favorites for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owners can update favorites" on public.user_favorites for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owners can delete favorites" on public.user_favorites for delete to authenticated using ((select auth.uid()) = user_id);
create policy "owners can read bookmarks" on public.user_bookmarks for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners can insert bookmarks" on public.user_bookmarks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owners can update bookmarks" on public.user_bookmarks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owners can delete bookmarks" on public.user_bookmarks for delete to authenticated using ((select auth.uid()) = user_id);
create policy "owners can read notes" on public.user_notes for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners can insert notes" on public.user_notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owners can update notes" on public.user_notes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owners can delete notes" on public.user_notes for delete to authenticated using ((select auth.uid()) = user_id);
create policy "owners can read playlists" on public.user_playlists for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners can insert playlists" on public.user_playlists for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owners can update playlists" on public.user_playlists for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owners can delete playlists" on public.user_playlists for delete to authenticated using ((select auth.uid()) = user_id);
create policy "owners can read playlist items" on public.user_playlist_items for select to authenticated using (exists (select 1 from public.user_playlists playlist where playlist.id = user_playlist_items.playlist_id and playlist.user_id = (select auth.uid())));
create policy "owners can insert playlist items" on public.user_playlist_items for insert to authenticated with check (exists (select 1 from public.user_playlists playlist where playlist.id = user_playlist_items.playlist_id and playlist.user_id = (select auth.uid())));
create policy "owners can update playlist items" on public.user_playlist_items for update to authenticated using (exists (select 1 from public.user_playlists playlist where playlist.id = user_playlist_items.playlist_id and playlist.user_id = (select auth.uid()))) with check (exists (select 1 from public.user_playlists playlist where playlist.id = user_playlist_items.playlist_id and playlist.user_id = (select auth.uid())));
create policy "owners can delete playlist items" on public.user_playlist_items for delete to authenticated using (exists (select 1 from public.user_playlists playlist where playlist.id = user_playlist_items.playlist_id and playlist.user_id = (select auth.uid())));
create policy "owners can read playback progress" on public.user_playback_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners can insert playback progress" on public.user_playback_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owners can update playback progress" on public.user_playback_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owners can delete playback progress" on public.user_playback_progress for delete to authenticated using ((select auth.uid()) = user_id);
create policy "owners can read quran reading progress" on public.user_quran_reading_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners can insert quran reading progress" on public.user_quran_reading_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owners can update quran reading progress" on public.user_quran_reading_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owners can delete quran reading progress" on public.user_quran_reading_progress for delete to authenticated using ((select auth.uid()) = user_id);
create policy "owners can read quran listening progress" on public.user_quran_listening_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners can insert quran listening progress" on public.user_quran_listening_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owners can update quran listening progress" on public.user_quran_listening_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owners can delete quran listening progress" on public.user_quran_listening_progress for delete to authenticated using ((select auth.uid()) = user_id);
create policy "owners can read preferences" on public.user_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners can insert preferences" on public.user_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owners can update preferences" on public.user_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owners can delete preferences" on public.user_preferences for delete to authenticated using ((select auth.uid()) = user_id);
create policy "owners can read follows" on public.user_follows for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners can insert follows" on public.user_follows for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owners can update follows" on public.user_follows for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owners can delete follows" on public.user_follows for delete to authenticated using ((select auth.uid()) = user_id);
create policy "owners can read downloads" on public.user_downloads for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners can insert downloads" on public.user_downloads for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owners can update downloads" on public.user_downloads for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owners can delete downloads" on public.user_downloads for delete to authenticated using ((select auth.uid()) = user_id);
create policy "owners can read sync events" on public.user_sync_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners can insert sync events" on public.user_sync_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owners can delete sync events" on public.user_sync_events for delete to authenticated using ((select auth.uid()) = user_id);
create policy "owners can read reports" on public.user_reports for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners can insert reports" on public.user_reports for insert to authenticated with check ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.catalog_sources, public.catalog_rights, public.catalog_topics, public.catalog_creators, public.catalog_series, public.catalog_media_assets, public.catalog_media_variants, public.catalog_contents, public.catalog_content_creators, public.catalog_content_topics, public.catalog_content_media, public.catalog_collections, public.catalog_collection_items, public.catalog_chapters, public.catalog_transcripts, public.catalog_transcript_segments to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.user_favorites, public.user_bookmarks, public.user_notes, public.user_playlists, public.user_playlist_items, public.user_playback_progress, public.user_quran_reading_progress, public.user_quran_listening_progress, public.user_preferences, public.user_follows, public.user_downloads, public.user_sync_events, public.user_reports to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-media', 'user-media', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "owners can read private media"
on storage.objects for select to authenticated
using (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners can upload private media"
on storage.objects for insert to authenticated
with check (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners can update private media"
on storage.objects for update to authenticated
using (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners can delete private media"
on storage.objects for delete to authenticated
using (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
