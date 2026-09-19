"use client";

import type { ContentItem, Series } from "@/lib/domain";
import { FollowControl } from "@/components/follow-control";

type Props = { series: Series; contents: ContentItem[]; followed: boolean; notifications: boolean; onToggleFollow:()=>void; onToggleNotifications:(enabled:boolean)=>void; onOpen:(content:ContentItem)=>void };

export function SeriesProfile({ series, contents, followed, notifications, onToggleFollow, onToggleNotifications, onOpen }: Props) {
  const ordered = series.orderedContentIds.map((id)=>contents.find((item)=>item.id===id)).filter((item): item is ContentItem=>Boolean(item));
  return <section className="series-profile"><header><div><p className="eyebrow">Série</p><h1>{series.title}</h1>{series.description && <p>{series.description}</p>}</div><FollowControl followed={followed} notifications={notifications} label="la série" onToggleFollow={onToggleFollow} onToggleNotifications={onToggleNotifications}/></header>
    <div className="series-episodes">{ordered.map((item,index)=><button type="button" key={item.id} onClick={()=>onOpen(item)}><span>{String(index+1).padStart(2,"0")}</span><strong>{item.title}</strong></button>)}</div>
  </section>;
}
