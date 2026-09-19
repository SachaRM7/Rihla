import type { MediaAsset, MediaVariant } from "./domain";

export function siblingMediaVariants(asset: MediaAsset, variants: MediaVariant[]) {
  return variants.filter((variant) => asset.variantIds?.includes(variant.id));
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
