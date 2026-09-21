"use client";

import { LoaderCircle, Pause, Play, RotateCcw, Timer, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ContentItem, MediaAsset, MediaChapter, MediaKind, MediaVariant, Transcript, TranscriptSegment } from "@/lib/domain";
import type { PlaybackRate } from "@/lib/preferences";
import { MediaModeSwitch } from "@/components/media-mode-switch";
import { MediaChapters } from "@/components/media-chapters";
import { TimedTranscript } from "@/components/timed-transcript";
import { SpokenSkipControls } from "@/components/spoken-skip-controls";

type Props = { content: ContentItem; asset: MediaAsset; variants?: MediaVariant[]; playbackRate: PlaybackRate; transcript?: Transcript; transcriptSegments?: TranscriptSegment[]; chapters?: MediaChapter[]; initialPositionMs?: number; autoplay?: boolean; onProgress?:(positionMs:number,durationMs:number)=>void; onEnded?:()=>void; onReportIssue?:(kind:"TEXT"|"TIMING"|"SOURCE"|"UNAVAILABLE",note?:string)=>void; onClose:()=>void };

export function SpokenPlayer({ content, asset, variants=[], playbackRate, transcript, transcriptSegments=[], chapters=[], initialPositionMs=0, autoplay=false, onProgress, onEnded, onReportIssue, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const videoRef = useRef<HTMLVideoElement|null>(null);
  const [mediaKind,setMediaKind]=useState<MediaKind>(asset.kind);
  const [playing,setPlaying]=useState(false);
  const [loading,setLoading]=useState(true);
  const [position,setPosition]=useState(initialPositionMs/1000);
  const [duration,setDuration]=useState((asset.durationMs??0)/1000);
  const [error,setError]=useState<string|null>(null);
  const [sleepMinutes,setSleepMinutes]=useState<number|null>(null);
  const [sleepAtEnd,setSleepAtEnd]=useState(false);
  const lastSavedRef = useRef(initialPositionMs);
  const sleepDeadlineRef = useRef<number|null>(null);
  const seek = useCallback((seconds: number) => {
    const media = mediaKind === "VIDEO" ? videoRef.current : audioRef.current;
    if (!media) return;
    media.currentTime = Math.min(Math.max(seconds, 0), media.duration || seconds);
    setPosition(media.currentTime);
  }, [mediaKind]);

  useEffect(()=>{ const media=mediaKind==="VIDEO"?videoRef.current:audioRef.current; if(media) media.playbackRate=playbackRate; },[mediaKind,playbackRate]);
  useEffect(()=>{ if(!autoplay || loading) return; const media=mediaKind==="VIDEO"?videoRef.current:audioRef.current; if(media?.paused) void media.play().catch(()=>undefined); },[autoplay, loading, mediaKind]);
  useEffect(()=>{
    if(typeof navigator==="undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: content.title, artist: content.description ?? "RIHLA", album: "RIHLA" });
    const media=()=>mediaKind==="VIDEO"?videoRef.current:audioRef.current;
    navigator.mediaSession.setActionHandler("play",()=>void media()?.play());
    navigator.mediaSession.setActionHandler("pause",()=>media()?.pause());
    navigator.mediaSession.setActionHandler("seekbackward",()=>seek((media()?.currentTime??0)-15));
    navigator.mediaSession.setActionHandler("seekforward",()=>seek((media()?.currentTime??0)+15));
    navigator.mediaSession.setActionHandler("seekto",(details)=>{if(details.seekTime!==undefined)seek(details.seekTime);});
    return ()=>{["play","pause","seekbackward","seekforward","seekto"].forEach((action)=>{try{navigator.mediaSession.setActionHandler(action as MediaSessionAction,null)}catch{}});};
  },[content.description, content.id, content.title, mediaKind, seek]);
  useEffect(()=>{
    if(sleepMinutes===null){sleepDeadlineRef.current=null;return;}
    sleepDeadlineRef.current=Date.now()+sleepMinutes*60_000;
    const timer=window.setInterval(()=>{if(sleepDeadlineRef.current&&Date.now()>=sleepDeadlineRef.current){(mediaKind==="VIDEO"?videoRef.current:audioRef.current)?.pause();setSleepMinutes(null);}},1000);
    return()=>window.clearInterval(timer);
  },[mediaKind,sleepMinutes]);
  const switchMedia=(kind:MediaKind)=>{const current=mediaKind==="VIDEO"?videoRef.current:audioRef.current;const next=kind==="VIDEO"?videoRef.current:audioRef.current;const at=current?.currentTime??position;current?.pause();setMediaKind(kind);window.requestAnimationFrame(()=>{if(next){next.currentTime=Math.min(at,next.duration||at);if(playing)void next.play();}});};
  const audioUrl=asset.kind==="AUDIO"?asset.url:variants.find((item)=>item.kind==="AUDIO")?.url;
  const videoUrl=asset.kind==="VIDEO"?asset.url:variants.find((item)=>item.kind==="VIDEO")?.url;
  const audioAvailable=Boolean(audioUrl);
  const videoAvailable=Boolean(videoUrl);
  return <section className="spoken-player" aria-label="Lecteur de contenu parlé">
    {audioUrl && <audio ref={audioRef} style={{display:mediaKind==="AUDIO"?"block":"none"}} src={audioUrl} preload="metadata" onLoadedMetadata={(e)=>{const a=e.currentTarget;a.currentTime=Math.min(initialPositionMs/1000,a.duration||0);setDuration(a.duration||0);setLoading(false);}} onTimeUpdate={(e)=>{
      if(typeof navigator!=="undefined" && "mediaSession" in navigator) navigator.mediaSession.playbackState="playing";
      const positionMs=e.currentTarget.currentTime*1000; const durationMs=(e.currentTarget.duration||0)*1000;
      setPosition(e.currentTarget.currentTime);
      if(Math.abs(positionMs-lastSavedRef.current)>=5000){lastSavedRef.current=positionMs;onProgress?.(positionMs,durationMs);}
    }} onPlay={()=>setPlaying(true)} onPause={()=>{setPlaying(false);if(typeof navigator!=="undefined"&&"mediaSession" in navigator)navigator.mediaSession.playbackState="paused";}} onWaiting={()=>setLoading(true)} onCanPlay={()=>{setLoading(false);setError(null);}} onError={()=>{setLoading(false);setPlaying(false);setError("Impossible de charger cet audio.");}} onEnded={()=>{setPlaying(false);onProgress?.(duration*1000,duration*1000);if(sleepAtEnd){setSleepAtEnd(false);audioRef.current?.pause();}else onEnded?.();}}/>}
    {videoUrl && <video ref={videoRef} className={mediaKind==="VIDEO"?"spoken-video active":"spoken-video"} src={videoUrl} playsInline controls={false}
      onLoadedMetadata={(e)=>{const media=e.currentTarget;media.currentTime=Math.min(initialPositionMs/1000,media.duration||0);media.playbackRate=playbackRate;setDuration(media.duration||0);setLoading(false);}}
      onTimeUpdate={(e)=>{const positionMs=e.currentTarget.currentTime*1000;const durationMs=(e.currentTarget.duration||0)*1000;setPosition(e.currentTarget.currentTime);if(Math.abs(positionMs-lastSavedRef.current)>=5000){lastSavedRef.current=positionMs;onProgress?.(positionMs,durationMs);}}}
      onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onWaiting={()=>setLoading(true)} onCanPlay={()=>{setLoading(false);setError(null);}}
      onError={()=>{setLoading(false);setPlaying(false);setError("Impossible de charger cette vidéo.");}}
      onEnded={()=>{setPlaying(false);onProgress?.(duration*1000,duration*1000);if(sleepAtEnd){setSleepAtEnd(false);videoRef.current?.pause();}else onEnded?.();}} />}
    <header><div><p className="eyebrow">En cours</p><h2>{content.title}</h2></div><button type="button" className="icon-button" aria-label="Fermer le lecteur" onClick={()=>{onProgress?.(position*1000,duration*1000);onClose();}}><X size={18}/></button></header>
    <MediaModeSwitch active={mediaKind} audioAvailable={audioAvailable} videoAvailable={videoAvailable} onChange={switchMedia} />
    <input type="range" min={0} max={duration||0} step={1} value={Math.min(position,duration||0)} onChange={(e)=>seek(Number(e.target.value))} aria-label="Position dans le contenu"/>
    {error && <div className="audio-error" role="alert"><span>{error}</span><button type="button" onClick={()=>{setError(null);(mediaKind==="VIDEO"?videoRef.current:audioRef.current)?.load();}}><RotateCcw size={14}/>Réessayer</button></div>}
    <div className="spoken-player-controls"><SpokenSkipControls onBack={()=>seek(position-15)} onForward={()=>seek(position+15)}/><button type="button" className="main-player-button" onClick={()=>{const a=mediaKind==="VIDEO"?videoRef.current:audioRef.current;if(!a)return;if(a.paused)void a.play();else a.pause();}}>{loading?<LoaderCircle className="spin" size={24}/>:playing?<Pause size={24}/>:<Play size={24}/>}</button></div>
    <div className="spoken-sleep"><span><Timer size={15}/>Minuterie</span><select value={sleepMinutes ?? ""} onChange={(e)=>{setSleepAtEnd(false);setSleepMinutes(e.target.value?Number(e.target.value):null)}}><option value="">Désactivée</option><option value={10}>10 min</option><option value={20}>20 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option></select><button type="button" className={sleepAtEnd?"active":""} aria-pressed={sleepAtEnd} onClick={()=>{setSleepMinutes(null);setSleepAtEnd(!sleepAtEnd)}}>Fin de l’épisode</button></div>
    {chapters.length > 0 && <MediaChapters chapters={chapters} positionMs={position*1000} onSeek={(ms)=>seek(ms/1000)} />}
    {transcript && transcriptSegments.length > 0 && <TimedTranscript transcript={transcript} segments={transcriptSegments} positionMs={position*1000} onSeek={(ms)=>seek(ms/1000)} onReportIssue={onReportIssue} />}
  </section>;
}
