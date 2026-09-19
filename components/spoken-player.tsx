"use client";

import { LoaderCircle, Pause, Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ContentItem, MediaAsset } from "@/lib/domain";
import type { PlaybackRate } from "@/lib/preferences";
import { SpokenSkipControls } from "@/components/spoken-skip-controls";

type Props = { content: ContentItem; asset: MediaAsset; playbackRate: PlaybackRate; initialPositionMs?: number; onProgress?:(positionMs:number,durationMs:number)=>void; onClose:()=>void };

export function SpokenPlayer({ content, asset, playbackRate, initialPositionMs=0, onProgress, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const [playing,setPlaying]=useState(false);
  const [loading,setLoading]=useState(true);
  const [position,setPosition]=useState(initialPositionMs/1000);
  const [duration,setDuration]=useState((asset.durationMs??0)/1000);
  useEffect(()=>{ const audio=audioRef.current; if(!audio)return; audio.playbackRate=playbackRate; },[playbackRate]);
  const seek=(seconds:number)=>{const audio=audioRef.current;if(!audio)return;audio.currentTime=Math.min(Math.max(seconds,0),audio.duration||seconds);setPosition(audio.currentTime);};
  return <section className="spoken-player" aria-label="Lecteur de contenu parlé">
    <audio ref={audioRef} src={asset.url} preload="metadata" onLoadedMetadata={(e)=>{const a=e.currentTarget;a.currentTime=Math.min(initialPositionMs/1000,a.duration||0);setDuration(a.duration||0);setLoading(false);}} onTimeUpdate={(e)=>{setPosition(e.currentTarget.currentTime);onProgress?.(e.currentTarget.currentTime*1000,(e.currentTarget.duration||0)*1000);}} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onWaiting={()=>setLoading(true)} onCanPlay={()=>setLoading(false)}/>
    <header><div><p className="eyebrow">En cours</p><h2>{content.title}</h2></div><button type="button" className="icon-button" aria-label="Fermer le lecteur" onClick={onClose}><X size={18}/></button></header>
    <input type="range" min={0} max={duration||0} step={1} value={Math.min(position,duration||0)} onChange={(e)=>seek(Number(e.target.value))} aria-label="Position dans le contenu"/>
    <div className="spoken-player-controls"><SpokenSkipControls onBack={()=>seek(position-15)} onForward={()=>seek(position+15)}/><button type="button" className="main-player-button" onClick={()=>{const a=audioRef.current;if(!a)return;if(a.paused)void a.play();else a.pause();}}>{loading?<LoaderCircle className="spin" size={24}/>:playing?<Pause size={24}/>:<Play size={24}/>}</button></div>
  </section>;
}
