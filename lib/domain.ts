export type ContentType =
  | "REMINDER"
  | "COURSE"
  | "LECTURE"
  | "INTERVIEW"
  | "PODCAST_EPISODE"
  | "VIDEO";

export type MediaKind = "AUDIO" | "VIDEO";
export type LanguageCode = "fr" | "ar" | "en";
export type EditorialLevel =
  | "DISCOVERY"
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED";

export type EditorialStatus =
  | "DRAFT"
  | "RIGHTS_REVIEW"
  | "METADATA_REVIEW"
  | "READY"
  | "PUBLISHED"
  | "RIGHTS_REJECTED"
  | "UNAVAILABLE"
  | "ARCHIVED";

export type RightsDecision = "YES" | "NO" | "UNKNOWN" | "CONDITIONAL";
export type RightsVerification =
  | "UNVERIFIED"
  | "AUTO_DETECTED"
  | "HUMAN_VERIFIED"
  | "PARTNER_VERIFIED";

export interface SourceRef {
  id: string;
  name: string;
  originalUrl: string;
  publisher?: string;
}

export interface RightsCapabilities {
  displayMetadata: RightsDecision;
  embed: RightsDecision;
  streamRemote: RightsDecision;
  hostCopy: RightsDecision;
  downloadOffline: RightsDecision;
  transcribe: RightsDecision;
  translate: RightsDecision;
  createChapters: RightsDecision;
  createClips: RightsDecision;
  modify: RightsDecision;
  commercialUse: RightsDecision;
}

export interface RightsRecord {
  id: string;
  sourceId: string;
  rightsHolder?: string;
  licenseType?: string;
  licenseVersion?: string;
  licenseUrl?: string;
  attributionText?: string;
  evidenceUrl?: string;
  verifiedAt?: string;
  verification: RightsVerification;
  capabilities: RightsCapabilities;
}

export interface Creator {
  id: string;
  slug: string;
  name: string;
  languages: LanguageCode[];
  roles: Array<"RECITER" | "TEACHER" | "SPEAKER" | "PODCASTER" | "ORGANIZATION">;
  officialUrls: string[];
}

export interface MediaVariant {
  id: string;
  mediaAssetId: string;
  kind: MediaKind;
  url: string;
  quality?: "DATA_SAVER" | "STANDARD" | "HIGH";
}

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  url: string;
  durationMs?: number;
  sourceId: string;
  rightsRecordId: string;
  variantIds?: string[];
}

export interface ContentItem {
  id: string;
  slug: string;
  type: ContentType;
  title: string;
  description?: string;
  language: LanguageCode;
  level?: EditorialLevel;
  status: EditorialStatus;
  creatorIds: string[];
  topicIds: string[];
  seriesId?: string;
  mediaAssetIds: string[];
  sourceId: string;
  publishedAt?: string;
}

export interface EditorialCollection {
  id: string;
  slug: string;
  title: string;
  description?: string;
  curatorName: string;
  topicIds: string[];
  contentIds: string[];
}

export interface FollowPreference {
  id: string;
  targetType: "CREATOR" | "SERIES";
  targetId: string;
  notifyNewPublications: boolean;
}

export interface Series {
  id: string;
  slug: string;
  title: string;
  description?: string;
  creatorIds: string[];
  orderedContentIds: string[];
}

export interface TranscriptSegment {
  id: string;
  transcriptId: string;
  startMs: number;
  endMs: number;
  text: string;
  position: number;
}

export interface MediaChapter {
  id: string;
  contentId: string;
  title: string;
  startMs: number;
  endMs?: number;
  position: number;
}

export interface TranscriptIssue {
  id: string;
  transcriptId: string;
  segmentId?: string;
  kind: "TEXT" | "TIMING" | "SOURCE" | "UNAVAILABLE";
  note?: string;
  createdAt: string;
  status: "OPEN" | "RESOLVED";
}

export interface Transcript {
  id: string;
  contentId: string;
  language: LanguageCode;
  status: "AUTOMATIC" | "CORRECTED" | "VALIDATED";
  sourceId?: string;
  segmentIds: string[];
}

export interface QuranReference {
  surah: number;
  ayah?: number;
  juz?: number;
  hizb?: number;
}

export interface Recitation {
  id: string;
  reciterId: string;
  sourceId: string;
  rightsRecordId: string;
  audioAssetId: string;
}

export interface PlaybackProgress {
  contentId: string;
  positionMs: number;
  completed: boolean;
  updatedAt: string;
}

export interface QuranListeningProgress {
  recitationId: string;
  reference: QuranReference;
  positionMs?: number;
  updatedAt: string;
}

export interface QuranReadingProgress {
  reference: QuranReference;
  updatedAt: string;
}

export type BookmarkTarget =
  | { kind: "QURAN"; reference: QuranReference }
  | { kind: "MEDIA"; contentId: string; positionMs: number }
  | { kind: "TRANSCRIPT"; transcriptSegmentId: string };

export interface Bookmark {
  id: string;
  target: BookmarkTarget;
  createdAt: string;
}

export interface PrivateNote {
  id: string;
  bookmarkId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
