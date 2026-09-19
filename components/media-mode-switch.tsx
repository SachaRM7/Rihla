"use client";

import { Headphones, Video } from "lucide-react";
import type { MediaKind } from "@/lib/domain";

type Props = { active: MediaKind; audioAvailable: boolean; videoAvailable: boolean; onChange: (kind: MediaKind) => void };

export function MediaModeSwitch({ active, audioAvailable, videoAvailable, onChange }: Props) {
  if (!(audioAvailable && videoAvailable)) return null;
  return <div className="media-mode-switch" role="radiogroup" aria-label="Format de lecture">
    <button type="button" role="radio" aria-checked={active === "AUDIO"} className={active === "AUDIO" ? "active" : ""} onClick={() => onChange("AUDIO")}><Headphones size={16}/>Audio</button>
    <button type="button" role="radio" aria-checked={active === "VIDEO"} className={active === "VIDEO" ? "active" : ""} onClick={() => onChange("VIDEO")}><Video size={16}/>Vidéo</button>
  </div>;
}
