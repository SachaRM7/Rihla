"use client";

import { ExternalLink, Languages } from "lucide-react";
import type { ContentItem, Creator } from "@/lib/domain";
import { FollowControl } from "@/components/follow-control";

type Props = {
  creator: Creator;
  contents: ContentItem[];
  followed: boolean;
  notifications: boolean;
  onToggleFollow: () => void;
  onToggleNotifications: (enabled: boolean) => void;
  onOpenContent: (content: ContentItem) => void;
};

export function CreatorProfile({ creator, contents, followed, notifications, onToggleFollow, onToggleNotifications, onOpenContent }: Props) {
  return <section className="creator-profile">
    <header>
      <div className="creator-avatar" aria-hidden="true">{creator.name.slice(0,1).toUpperCase()}</div>
      <div><p className="eyebrow">{creator.roles.join(" · ").toLocaleLowerCase("fr")}</p><h1>{creator.name}</h1><span><Languages size={14}/>{creator.languages.join(" · ").toUpperCase()}</span></div>
      <FollowControl followed={followed} notifications={notifications} label={creator.name} onToggleFollow={onToggleFollow} onToggleNotifications={onToggleNotifications}/>
    </header>
    {creator.officialUrls.length > 0 && <div className="creator-links">{creator.officialUrls.map((url)=><a href={url} target="_blank" rel="noreferrer" key={url}><ExternalLink size={14}/>Source officielle</a>)}</div>}
    <div className="section-title-row"><div><p className="eyebrow">Publications</p><h2>Contenus disponibles</h2></div><span className="section-count">{contents.length}</span></div>
    {contents.length ? <div className="library-grid">{contents.map((content)=><button type="button" key={content.id} onClick={()=>onOpenContent(content)}><div><strong>{content.title}</strong><small>{content.type.replaceAll("_"," ").toLocaleLowerCase("fr")}</small></div></button>)}</div> : <p className="preferences-copy">Aucun contenu autorisé disponible pour le moment.</p>}
  </section>;
}
