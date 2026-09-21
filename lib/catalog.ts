import type { ContentItem, Creator, EditorialCollection, MediaAsset, MediaChapter, MediaVariant, RightsRecord, Series, SourceRef, Topic, Transcript, TranscriptSegment } from "./domain";

export interface CatalogBundle {
  sources: SourceRef[];
  rights: RightsRecord[];
  creators: Creator[];
  series: Series[];
  media: MediaAsset[];
  contents: ContentItem[];
  topics?: Topic[];
  collections?: EditorialCollection[];
  transcripts?: Transcript[];
  transcriptSegments?: TranscriptSegment[];
  chapters?: MediaChapter[];
  variants?: MediaVariant[];
}

export interface PublishabilityIssue {
  code: "SOURCE_MISSING" | "MEDIA_MISSING" | "RIGHTS_MISSING" | "STREAM_FORBIDDEN" | "COMMERCIAL_UNKNOWN" | "RIGHTS_NOT_VERIFIED" | "MEDIA_METADATA_MISSING" | "CREATOR_MISSING" | "TOPIC_MISSING" | "URL_INVALID" | "RIGHTS_REVOKED";
  message: string;
}

function isHttpUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function validatePublishability(item: ContentItem, catalog: CatalogBundle): PublishabilityIssue[] {
  const issues: PublishabilityIssue[] = [];
  const source = catalog.sources.find((entry) => entry.id === item.sourceId);
  if (!source) issues.push({ code: "SOURCE_MISSING", message: "Source éditoriale manquante." });
  if (source && !isHttpUrl(source.originalUrl)) issues.push({ code: "URL_INVALID", message: "URL de source invalide." });

  for (const creatorId of item.creatorIds) {
    if (!catalog.creators.some((creator) => creator.id === creatorId)) issues.push({ code: "CREATOR_MISSING", message: `Créateur ${creatorId} introuvable.` });
  }
  for (const topicId of item.topicIds) {
    if (!catalog.topics?.some((topic) => topic.id === topicId)) issues.push({ code: "TOPIC_MISSING", message: `Thème ${topicId} introuvable.` });
  }

  if (item.mediaAssetIds.length === 0) issues.push({ code: "MEDIA_MISSING", message: "Aucun média attaché." });
  for (const mediaId of item.mediaAssetIds) {
    const media = catalog.media.find((entry) => entry.id === mediaId);
    if (!media) { issues.push({ code: "MEDIA_MISSING", message: `Média ${mediaId} introuvable.` }); continue; }
    if (!isHttpUrl(media.url)) issues.push({ code: "URL_INVALID", message: `URL média invalide pour ${mediaId}.` });
    if (!media.mimeType || !media.durationMs || media.durationMs <= 0) issues.push({ code: "MEDIA_METADATA_MISSING", message: `Métadonnées média incomplètes pour ${mediaId}.` });
    const rights = catalog.rights.find((entry) => entry.id === media.rightsRecordId);
    if (!rights) { issues.push({ code: "RIGHTS_MISSING", message: `Droits manquants pour ${mediaId}.` }); continue; }
    if (rights.revokedAt) issues.push({ code: "RIGHTS_REVOKED", message: `Droits révoqués pour ${mediaId}.` });
    if (rights.verification !== "HUMAN_VERIFIED" && rights.verification !== "PARTNER_VERIFIED") issues.push({ code: "RIGHTS_NOT_VERIFIED", message: `Droits non vérifiés humainement pour ${mediaId}.` });
    const streamAllowed = rights.capabilities.streamRemote === "YES" || rights.capabilities.hostCopy === "YES" || rights.capabilities.embed === "YES";
    if (!streamAllowed) issues.push({ code: "STREAM_FORBIDDEN", message: `Aucun mode de diffusion autorisé pour ${mediaId}.` });
    if (rights.capabilities.commercialUse === "UNKNOWN") issues.push({ code: "COMMERCIAL_UNKNOWN", message: `Usage commercial non vérifié pour ${mediaId}.` });
  }
  return issues;
}

export function canPublish(item: ContentItem, catalog: CatalogBundle) {
  return validatePublishability(item, catalog).length === 0 && (item.status === "READY" || item.status === "PUBLISHED");
}

export function publicContents(catalog: CatalogBundle) {
  return catalog.contents.filter((item) => item.status === "PUBLISHED" && canPublish(item, catalog));
}

export function validateCatalog(catalog: CatalogBundle) {
  return catalog.contents.flatMap((item) => validatePublishability(item, catalog).map((issue) => ({ contentId: item.id, ...issue })));
}
