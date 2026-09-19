"use client";

import { ChevronDown, ChevronUp, ListMusic } from "lucide-react";
import type { QueueEntry } from "@/lib/playback";

type Props = {
  queue: QueueEntry[];
  onPlay: (entry: QueueEntry) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, toIndex: number) => void;
  onClear: () => void;
};

export function PlaybackQueue({ queue, onPlay, onRemove, onMove, onClear }: Props) {
  return <section className="playback-queue" aria-label="File d’attente">
    <div className="section-title-row"><div><p className="eyebrow">À suivre</p><h2>File d’attente</h2></div>{queue.length > 0 && <button type="button" className="text-action" onClick={onClear}>Vider</button>}</div>
    {queue.length === 0 ? <div className="empty-library compact"><ListMusic size={20}/><strong>File vide</strong><p>Ajoutez plusieurs écoutes pour les préparer à l’avance.</p></div> :
      <div className="queue-list">{queue.map((entry,index)=><div className="queue-row" key={entry.id}>
        <button type="button" className="queue-main" onClick={()=>onPlay(entry)}><span>{String(index+1).padStart(2,"0")}</span><div><strong>{entry.item.title}</strong>{entry.item.subtitle && <small>{entry.item.subtitle}</small>}</div></button>
        <span className="queue-actions"><button type="button" aria-label="Monter" disabled={index===0} onClick={()=>onMove(entry.id,index-1)}><ChevronUp size={15}/></button><button type="button" aria-label="Descendre" disabled={index===queue.length-1} onClick={()=>onMove(entry.id,index+1)}><ChevronDown size={15}/></button><button type="button" aria-label="Retirer" onClick={()=>onRemove(entry.id)}>×</button></span>
      </div>)}</div>}
  </section>;
}
