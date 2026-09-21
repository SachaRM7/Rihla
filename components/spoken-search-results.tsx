"use client";

import { ChevronRight, ListMusic, Plus, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { OfflineDownloadControl } from "@/components/offline-download-control";
import { canDownloadOffline } from "@/lib/offline";
import type { ContentItem, MediaAsset } from "@/lib/domain";
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
  onQueue?: (content: ContentItem) => void;
  onPlayNext?: (content: ContentItem) => void;
  onAddToPlaylist?: (content: ContentItem) => void;
  downloadStates?: Record<string, "QUEUED"|"DOWNLOADING"|"AVAILABLE"|"ERROR">;
  onDownload?: (content: ContentItem, asset: MediaAsset) => void;
  contentIds?: string[];
};

export function SpokenSearchResults({ catalog, query, onOpen, onQueue, onPlayNext, onAddToPlaylist, downloadStates = {}, onDownload, contentIds }: Props) {
  const [language, setLanguage] = useState("");
  const [duration, setDuration] = useState<SpokenDurationFilter>("all");
  const [creatorId, setCreatorId] = useState("");

  const scopedCatalog = useMemo(() => contentIds ? { ...catalog, contents: catalog.contents.filter((item) => contentIds.includes(item.id)) } : catalog, [catalog, contentIds]);
  const options = useMemo(() => spokenFilterOptions(scopedCatalog, query), [query, scopedCatalog]);
  const results = useMemo(
    () => searchSpokenCatalog(scopedCatalog, query, { language: language || undefined, duration, creatorId: creatorId || undefined }),
    [creatorId, duration, language, query, scopedCatalog],
  );

  const hasFilters = options.languages.length > 1 || options.hasDurations || options.creators.length > 0;

  return <section className="spoken-search-results" aria-labelledby="spoken-results-title">
    {hasFilters && <div className="spoken-search-filters">
      {options.languages.length > 1 && <label><span>Langue</span><select value={language} onChange={(event)=>setLanguage(event.target.value)}><option value="">Toutes</option>{options.languages.map((value)=><option value={value} key={value}>{value.toUpperCase()}</option>)}</select></label>}
      {options.hasDurations && <label><span>Durée</span><select value={duration} onChange={(event)=>setDuration(event.target.value as SpokenDurationFilter)}><option value="all">Toutes</option><option value="short">≤ 10 min</option><option value="medium">10–30 min</option><option value="long">&gt; 30 min</option></select></label>}
      {options.creators.length > 0 && <label><span>Intervenant</span><select value={creatorId} onChange={(event)=>setCreatorId(event.target.value)}><option value="">Tous</option>{options.creators.map((creator)=><option value={creator.id} key={creator.id}>{creator.name}</option>)}</select></label>}
    </div>}

    <div className="section-title-row"><div><p className="eyebrow">Cours, archives et contenus audio</p><h2 id="spoken-results-title">Contenus disponibles</h2></div><span className="result-count">{results.length}</span></div>
    {results.length ? <div className="spoken-search-list">{results.map(({item,durationMs,creators})=>{
      const asset = item.mediaAssetIds.map((id)=>scopedCatalog.media.find((media)=>media.id===id)).find((media): media is MediaAsset=>Boolean(media&&media.kind==="AUDIO"));
      const downloadable = Boolean(asset && canDownloadOffline(asset,scopedCatalog.rights));
      return <div className="spoken-search-result" key={item.id}>
        <button type="button" className="spoken-search-main" onClick={()=>onOpen(item)}>
          <span className="search-hit-copy"><strong>{item.title}</strong><span>{item.description ?? creators.map((creator)=>creator.name).join(" · ")}</span><small>{[creators.map((creator)=>creator.name).join(" · "),item.language.toUpperCase(),formatMediaDuration(durationMs)].filter(Boolean).join(" · ")}</small></span>
          <ChevronRight size={17}/>
        </button>
        <div className="spoken-search-actions">
          {onPlayNext && <button type="button" onClick={()=>onPlayNext(item)} aria-label={`Lire ${item.title} ensuite`}><Plus size={15}/>Ensuite</button>}
          {onQueue && <button type="button" onClick={()=>onQueue(item)} aria-label={`Ajouter ${item.title} à la file`}><Plus size={15}/>File</button>}
          {onAddToPlaylist && <button type="button" onClick={()=>onAddToPlaylist(item)} aria-label={`Ajouter ${item.title} à une playlist`}><ListMusic size={15}/>Playlist</button>}
          {asset && onDownload && <OfflineDownloadControl allowed={downloadable} status={downloadStates[item.id]} onDownload={()=>onDownload(item,asset)} />}
        </div>
      </div>;
    })}</div> : <div className="empty-library compact"><SearchX size={22}/><strong>Aucun contenu trouvé</strong><p>Essayez un autre terme ou retirez un filtre.</p></div>}
  </section>;
}
