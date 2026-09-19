import type { ContentItem, Creator, EditorialCollection, MediaAsset, MediaChapter, MediaVariant, RightsRecord, Series, SourceRef, Transcript, TranscriptSegment } from "./domain";

export interface CatalogBundle {
  sources: SourceRef[];
  rights: RightsRecord[];
  creators: Creator[];
  series: Series[];
  media: MediaAsset[];
  contents: ContentItem[];
  collections?: EditorialCollection[];
  transcripts?: Transcript[];
  transcriptSegments?: TranscriptSegment[];
  chapters?: MediaChapter[];
  variants?: MediaVariant[];
}

export interface PublishabilityIssue {
  code: "SOURCE_MISSING" | "MEDIA_MISSING" | "RIGHTS_MISSING" | "STREAM_FORBIDDEN" | "COMMERCIAL_UNKNOWN";
  message: string;
}

export function validatePublishability(item: ContentItem, catalog: CatalogBundle): PublishabilityIssue[] {
  const issues: PublishabilityIssue[] = [];
  const source = catalog.sources.find((entry) => entry.id === item.sourceId);
  if (!source) issues.push({ code: "SOURCE_MISSING", message: "Source éditoriale manquante." });

  if (item.mediaAssetIds.length === 0) issues.push({ code: "MEDIA_MISSING", message: "Aucun média attaché." });
  for (const mediaId of item.mediaAssetIds) {
    const media = catalog.media.find((entry) => entry.id === mediaId);
    if (!media) { issues.push({ code: "MEDIA_MISSING", message: `Média ${mediaId} introuvable.` }); continue; }
    const rights = catalog.rights.find((entry) => entry.id === media.rightsRecordId);
    if (!rights) { issues.push({ code: "RIGHTS_MISSING", message: `Droits manquants pour ${mediaId}.` }); continue; }
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
