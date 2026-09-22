import type { MediaAsset, MediaKind, MediaVariant } from "./domain";

function belongsToAsset(asset: MediaAsset, variant: MediaVariant) {
  // mediaAssetId is the authoritative link between an asset and its variants:
  // a variant that points to another asset must never be played for this content.
  if (variant.mediaAssetId) return variant.mediaAssetId === asset.id;
  return Boolean(asset.variantIds?.includes(variant.id));
}

export function variantsForAsset(asset: MediaAsset, variants: MediaVariant[]) {
  return variants.filter((variant) => belongsToAsset(asset, variant));
}

export function siblingMediaVariants(asset: MediaAsset, variants: MediaVariant[]) {
  return variantsForAsset(asset, variants);
}

export function findSwitchVariant(
  asset: MediaAsset,
  variants: MediaVariant[],
  target: MediaKind,
) {
  return variantsForAsset(asset, variants).find((variant) => variant.kind === target) ?? null;
}

export function mediaUrlForKind(asset: MediaAsset, variants: MediaVariant[], kind: MediaKind) {
  if (asset.kind === kind && asset.url) return asset.url;
  return findSwitchVariant(asset, variants, kind)?.url;
}

export function preserveMediaPosition(positionMs: number, durationMs?: number) {
  if (!Number.isFinite(positionMs)) return 0;
  if (!durationMs || durationMs <= 0) return Math.max(0, positionMs);
  return Math.min(Math.max(0, positionMs), durationMs);
}

export function preferredMediaVariant(
  asset: MediaAsset,
  variants: MediaVariant[],
  quality: "data-saver" | "standard" | "high",
) {
  const siblings = variantsForAsset(asset, variants).filter((variant) => variant.kind === asset.kind);
  if (!siblings.length) return null;
  const wanted = quality === "data-saver" ? "DATA_SAVER" : quality === "high" ? "HIGH" : "STANDARD";
  return siblings.find((variant) => variant.quality === wanted)
    ?? siblings.find((variant) => variant.quality === "STANDARD")
    ?? siblings[0];
}
