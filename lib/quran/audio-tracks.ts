import type { AudioLanguage } from "../preferences";
import type { AyahPlayback } from "./types";

/** Piste jouée pour une ayah : la récitation arabe ou la lecture de la traduction française. */
export type AudioSegment = "ar" | "fr";

export function firstAudioSegment(language: AudioLanguage): AudioSegment {
  return language === "fr" ? "fr" : "ar";
}

export function isSegmentAllowed(language: AudioLanguage, segment: AudioSegment) {
  return language === "ar-fr" || firstAudioSegment(language) === segment;
}

/** Sans lecture française disponible, on retombe sur la récitation arabe. */
export function ayahSegmentUrl(ayah: Pick<AyahPlayback, "audioUrl" | "frenchAudioUrl">, segment: AudioSegment) {
  return segment === "fr" && ayah.frenchAudioUrl ? ayah.frenchAudioUrl : ayah.audioUrl;
}

/** Segment qui suit la fin de `segment`, ou null quand l'ayah est terminée. */
export function nextAudioSegment(
  language: AudioLanguage,
  segment: AudioSegment,
  ayah: Pick<AyahPlayback, "frenchAudioUrl">,
): AudioSegment | null {
  if (language === "ar-fr" && segment === "ar" && ayah.frenchAudioUrl) return "fr";
  return null;
}
