/**
 * Schema snapshot compatible with `supabase gen types typescript`.
 * Refresh it after applying migrations with:
 * supabase gen types typescript --linked --schema public
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<TRow extends Record<string, unknown>> = {
  Row: TRow;
  Insert: Partial<TRow>;
  Update: Partial<TRow>;
  Relationships: [];
};

type Timestamped = { created_at: string; updated_at: string };

export type Database = {
  public: {
    Tables: {
      profiles: Table<{ id: string; display_name: string | null; avatar_path: string | null } & Timestamped>;
      catalog_sources: Table<{ id: string; name: string; original_url: string; publisher: string | null; accessed_at: string | null; created_at: string }>;
      catalog_rights: Table<{ id: string; source_id: string; rights_holder: string | null; license_type: string | null; license_version: string | null; license_url: string | null; attribution_text: string | null; evidence_url: string | null; verified_at: string | null; verification: Database["public"]["Enums"]["rights_verification"]; display_metadata: string; embed: string; stream_remote: string; host_copy: string; download_offline: string; transcribe: string; translate: string; create_chapters: string; create_clips: string; modify: string; commercial_use: string; review_notes: string | null; revoked_at: string | null; created_at: string }>;
      catalog_topics: Table<{ id: string; slug: string; label: string }>;
      catalog_creators: Table<{ id: string; slug: string; name: string; languages: string[]; roles: string[]; official_urls: string[] }>;
      catalog_series: Table<{ id: string; slug: string; title: string; description: string | null }>;
      catalog_media_assets: Table<{ id: string; kind: string; url: string; duration_ms: number | null; source_id: string; rights_record_id: string; mime_type: string | null; size_bytes: number | null; checksum_sha1: string | null; source_file_name: string | null; created_at: string }>;
      catalog_media_variants: Table<{ id: string; media_asset_id: string; kind: string; url: string; quality: string | null; mime_type: string | null; size_bytes: number | null; checksum_sha1: string | null }>;
      catalog_contents: Table<{ id: string; slug: string; type: string; title: string; description: string | null; language: string; level: string | null; status: Database["public"]["Enums"]["catalog_editorial_status"]; series_id: string | null; source_id: string; artwork_url: string | null; artwork_alt: string | null; published_at: string | null } & Timestamped>;
      catalog_content_creators: Table<{ content_id: string; creator_id: string }>;
      catalog_content_topics: Table<{ content_id: string; topic_id: string }>;
      catalog_content_media: Table<{ content_id: string; media_asset_id: string; position: number }>;
      catalog_collections: Table<{ id: string; slug: string; title: string; description: string | null; curator_name: string }>;
      catalog_collection_items: Table<{ collection_id: string; content_id: string; position: number }>;
      catalog_chapters: Table<{ id: string; content_id: string; title: string; start_ms: number; end_ms: number | null; position: number }>;
      catalog_transcripts: Table<{ id: string; content_id: string; language: string; status: string; source_id: string | null }>;
      catalog_transcript_segments: Table<{ id: string; transcript_id: string; start_ms: number; end_ms: number; text: string; position: number }>;
      user_favorites: Table<{ id: string; user_id: string; target_kind: string; target_id: string; created_at: string }>;
      user_bookmarks: Table<{ id: string; user_id: string; target_kind: string; target_id: string; position_ms: number | null; note: string | null } & Timestamped>;
      user_notes: Table<{ id: string; user_id: string; target_kind: string; target_id: string; body: string } & Timestamped>;
      user_playlists: Table<{ id: string; user_id: string; title: string; allow_mixed_content: boolean } & Timestamped>;
      user_playlist_items: Table<{ id: string; playlist_id: string; position: number; item_type: Database["public"]["Enums"]["playlist_item_type"]; item_id: string; created_at: string }>;
      user_playback_progress: Table<{ user_id: string; content_id: string; position_ms: number; duration_ms: number | null; completed: boolean; updated_at: string }>;
      user_quran_reading_progress: Table<{ user_id: string; surah: number; ayah: number; updated_at: string }>;
      user_quran_listening_progress: Table<{ user_id: string; recitation_id: string; reference: Json; position_ms: number | null; updated_at: string }>;
      user_preferences: Table<{ user_id: string; preference_key: string; value: Json; updated_at: string }>;
      user_follows: Table<{ user_id: string; target_type: Database["public"]["Enums"]["user_target_type"]; target_id: string; notify_new_publications: boolean; created_at: string }>;
      user_downloads: Table<{ user_id: string; content_id: string; media_asset_id: string; transcript_id: string | null; size_bytes: number | null; quality: string | null; status: string; downloaded_at: string | null; updated_at: string }>;
      user_sync_events: Table<{ id: string; user_id: string; device_id: string; entity: string; operation: string; entity_id: string; payload: Json | null; client_updated_at: string | null; created_at: string }>;
      user_reports: Table<{ id: string; user_id: string; content_id: string; kind: string; note: string | null; status: Database["public"]["Enums"]["report_status"]; created_at: string; resolved_at: string | null }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      catalog_editorial_status: "DRAFT" | "RIGHTS_REVIEW" | "METADATA_REVIEW" | "READY" | "PUBLISHED" | "RIGHTS_REJECTED" | "UNAVAILABLE" | "ARCHIVED";
      rights_verification: "UNVERIFIED" | "AUTO_DETECTED" | "HUMAN_VERIFIED" | "PARTNER_VERIFIED";
      user_target_type: "CREATOR" | "SERIES";
      playlist_item_type: "QURAN_AYAH" | "CONTENT";
      report_status: "OPEN" | "RESOLVED" | "DISMISSED";
    };
    CompositeTypes: Record<string, never>;
  };
};
