import type { EditorialCollection } from "@/lib/domain";

type Props = { collections: EditorialCollection[]; onOpen: (collection: EditorialCollection) => void };

export function EditorialCollections({ collections, onOpen }: Props) {
  if (!collections.length) return null;
  return <section className="editorial-collections">
    <div className="section-title-row"><div><p className="eyebrow">Sélections</p><h2>Explorer par sujet</h2></div></div>
    <div className="editorial-collection-grid">{collections.map((collection) => <button type="button" key={collection.id} onClick={()=>onOpen(collection)}><strong>{collection.title}</strong>{collection.description && <span>{collection.description}</span>}<small>Sélection par {collection.curatorName}</small></button>)}</div>
  </section>;
}
