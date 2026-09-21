"use client";

import { ChevronRight, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import type { ContentItem } from "@/lib/domain";
import type { CatalogBundle } from "@/lib/catalog";
import {
  formatMediaDuration,
  searchSpokenCatalog,
  spokenFilterOptions,
  type SpokenDurationFilter,
} from "@/lib/spoken-search";

type Props = {
  catalog: CatalogBundle;
  query: string;
  onOpen: (content: ContentItem) => void;
};

export function SpokenSearchResults({ catalog, query, onOpen }: Props) {
  const [language, setLanguage] = useState("");
  const [duration, setDuration] = useState<SpokenDurationFilter>("all");
  const [creatorId, setCreatorId] = useState("");

  const options = useMemo(() => spokenFilterOptions(catalog, query), [catalog, query]);
  const results = useMemo(
    () => searchSpokenCatalog(catalog, query, { language: language || undefined, duration, creatorId: creatorId || undefined }),
    [catalog, creatorId, duration, language, query],
  );

  const hasFilters = options.languages.length > 1 || options.hasDurations || options.creators.length > 0;

  return <section className="spoken-search-results" aria-labelledby="spoken-results-title">
    {hasFilters && <div className="spoken-search-filters">
      {options.languages.length > 1 && <label><span>Langue</span><select value={language} onChange={(event)=>setLanguage(event.target.value)}><option value="">Toutes</option>{options.languages.map((value)=><option value={value} key={value}>{value.toUpperCase()}</option>)}</select></label>}
      {options.hasDurations && <label><span>Durée</span><select value={duration} onChange={(event)=>setDuration(event.target.value as SpokenDurationFilter)}><option value="all">Toutes</option><option value="short">≤ 10 min</option><option value="medium">10–30 min</option><option value="long">&gt; 30 min</option></select></label>}
      {options.creators.length > 0 && <label><span>Intervenant</span><select value={creatorId} onChange={(event)=>setCreatorId(event.target.value)}><option value="">Tous</option>{options.creators.map((creator)=><option value={creator.id} key={creator.id}>{creator.name}</option>)}</select></label>}
    </div>}

    <div className="section-title-row"><div><p className="eyebrow">Cours, rappels, conférences</p><h2 id="spoken-results-title">Contenus disponibles</h2></div><span className="result-count">{results.length}</span></div>
    {results.length ? <div className="spoken-search-list">{results.map(({item,durationMs,creators})=><button type="button" key={item.id} onClick={()=>onOpen(item)}>
      <span className="search-hit-copy"><strong>{item.title}</strong><span>{item.description ?? creators.map((creator)=>creator.name).join(" · ")}</span><small>{[creators.map((creator)=>creator.name).join(" · "),item.language.toUpperCase(),formatMediaDuration(durationMs)].filter(Boolean).join(" · ")}</small></span>
      <ChevronRight size={17}/>
    </button>)}</div> : <div className="empty-library compact"><SearchX size={22}/><strong>Aucun contenu trouvé</strong><p>Essayez un autre terme ou retirez un filtre.</p></div>}
  </section>;
}
