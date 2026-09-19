"use client";

import { LoaderCircle, Pause, Play, RotateCcw, X } from "lucide-react";
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
  const [error,setError]=useState<string|null>(null);
  const lastSavedRef = useRef(initialPositionMs);
  useEffect(()=>{ const audio=audioRef.current; if(!audio)return; audio.playbackRate=playbackRate; },[playbackRate]);
  useEffect(()=>{
    if(typeof navigator==="undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: content.title, artist: content.description ?? "RIHLA", album: "RIHLA" });
    navigator.mediaSession.setActionHandler("play",()=>void audioRef.current?.play());
    navigator.mediaSession.setActionHandler("pause",()=>audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("seekbackward",()=>seek((audioRef.current?.currentTime??0)-15));
    navigator.mediaSession.setActionHandler("seekforward",()=>seek((audioRef.current?.currentTime??0)+15));
    navigator.mediaSession.setActionHandler("seekto",(details)=>{if(details.seekTime!==undefined)seek(details.seekTime);});
    return ()=>{["play","pause","seekbackward","seekforward","seekto"].forEach((action)=>{try{navigator.mediaSession.setActionHandler(action as MediaSessionAction,null)}catch{}});};
  },[content.id]);
  const seek=(seconds:number)=>{const audio=audioRef.current;if(!audio)return;audio.currentTime=Math.min(Math.max(seconds,0),audio.duration||seconds);setPosition(audio.currentTime);};
  return <section className="spoken-player" aria-label="Lecteur de contenu parlé">
    <audio ref={audioRef} src={asset.url} preload="metadata" onLoadedMetadata={(e)=>{const a=e.currentTarget;a.currentTime=Math.min(initialPositionMs/1000,a.duration||0);setDuration(a.duration||0);setLoading(false);}} onTimeUpdate={(e)=>{
      const positionMs=e.currentTarget.currentTime*1000; const durationMs=(e.currentTarget.duration||0)*1000;
      setPosition(e.currentTarget.currentTime);
      if(Math.abs(positionMs-lastSavedRef.current)>=5000){lastSavedRef.current=positionMs;onProgress?.(positionMs,durationMs);}
    }} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onWaiting={()=>setLoading(true)} onCanPlay={()=>{setLoading(false);setError(null);}} onError={()=>{setLoading(false);setPlaying(false);setError("Impossible de charger cet audio.");}} onEnded={()=>{setPlaying(false);onProgress?.(duration*1000,duration*1000);}}/>
    <header><div><p className="eyebrow">En cours</p><h2>{content.title}</h2></div><button type="button" className="icon-button" aria-label="Fermer le lecteur" onClick={()=>{onProgress?.(position*1000,duration*1000);onClose();}}><X size={18}/></button></header>
    <input type="range" min={0} max={duration||0} step={1} value={Math.min(position,duration||0)} onChange={(e)=>seek(Number(e.target.value))} aria-label="Position dans le contenu"/>
    {error && <div className="audio-error" role="alert"><span>{error}</span><button type="button" onClick={()=>{setError(null);audioRef.current?.load();}}><RotateCcw size={14}/>Réessayer</button></div>}
    <div className="spoken-player-controls"><SpokenSkipControls onBack={()=>seek(position-15)} onForward={()=>seek(position+15)}/><button type="button" className="main-player-button" onClick={()=>{const a=audioRef.current;if(!a)return;if(a.paused)void a.play();else a.pause();}}>{loading?<LoaderCircle className="spin" size={24}/>:playing?<Pause size={24}/>:<Play size={24}/>}</button></div>
  </section>;
}
