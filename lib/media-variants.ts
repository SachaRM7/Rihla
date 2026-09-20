import type { MediaAsset, MediaVariant } from "./domain";

export function siblingMediaVariants(asset: MediaAsset, variants: MediaVariant[]) {
  return variants.filter((variant) => variant.mediaAssetId === asset.id && asset.variantIds?.includes(variant.id));
}

export function findSwitchVariant(
  asset: MediaAsset,
  variants: MediaVariant[],
  target: "AUDIO" | "VIDEO",
) {
  return siblingMediaVariants(asset, variants).find((variant) => variant.kind === target) ?? null;
}

export function preserveMediaPosition(positionMs: number, durationMs?: number) {
  if (!durationMs || durationMs <= 0) return Math.max(0, positionMs);
  return Math.min(Math.max(0, positionMs), durationMs);
}

export function preferredMediaVariant(
  asset: MediaAsset,
  variants: MediaVariant[],
  quality: "data-saver" | "standard" | "high",
) {
  const siblings = siblingMediaVariants(asset, variants).filter((variant) => variant.kind === asset.kind);
  if (!siblings.length) return null;
  const wanted = quality === "data-saver" ? "DATA_SAVER" : quality === "high" ? "HIGH" : "STANDARD";
  return siblings.find((variant) => variant.quality === wanted)
    ?? siblings.find((variant) => variant.quality === "STANDARD")
    ?? siblings[0];
}
