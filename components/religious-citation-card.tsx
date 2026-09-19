import type { ReligiousCitation } from "@/lib/domain";

export function ReligiousCitationCard({ citation }: { citation: ReligiousCitation }) {
  return <figure className="religious-citation">
    <blockquote>{citation.text}</blockquote>
    <figcaption>
      <strong>{citation.reference}</strong>
      {citation.grading?.length ? <div className="citation-gradings">{citation.grading.map((grading, index) => <span key={index}><b>{grading.label}</b> · attribué à {grading.attributedTo}</span>)}</div> : null}
      {citation.sourceUrl && <a href={citation.sourceUrl} target="_blank" rel="noreferrer">Voir la source</a>}
    </figcaption>
  </figure>;
}
