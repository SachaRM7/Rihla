import { ExternalLink, ShieldCheck } from "lucide-react";
import type { SourceAttribution } from "@/lib/quran/types";

type Props = {
  source: SourceAttribution;
};

export function SourceDisclosure({ source }: Props) {
  return (
    <aside className="source-disclosure" aria-label="Provenance du contenu">
      <ShieldCheck size={18} aria-hidden="true" />
      <div>
        <strong>Source vérifiable</strong>
        <p>Texte, traduction et audio diffusés depuis {source.name}. {source.translationAuthor ? `${source.translationName} · ${source.translationAuthor}. ` : ""}Le texte arabe reste séparé de la traduction.</p>
      </div>
      <a href={source.termsUrl} target="_blank" rel="noreferrer">
        Conditions <ExternalLink size={14} aria-hidden="true" />
      </a>
    </aside>
  );
}
