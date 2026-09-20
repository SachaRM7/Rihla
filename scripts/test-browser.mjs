// Fixtures exist only in this ephemeral browser bundle, never in production.
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const port=4317, origin=`http://127.0.0.1:${port}`;
const capabilities=Object.fromEntries(['displayMetadata','embed','streamRemote','hostCopy','downloadOffline','transcribe','translate','createChapters','createClips','modify','commercialUse'].map(k=>[k,k==='downloadOffline'?'NO':'YES']));
const catalog={sources:[{id:'test-source',name:'Test fixture',originalUrl:origin}],rights:[{id:'test-rights',sourceId:'test-source',verification:'HUMAN_VERIFIED',capabilities}],creators:[],series:[],collections:[],contents:[{id:'fixture',slug:'fixture',type:'COURSE',title:'TEST SPOKEN FIXTURE',language:'fr',status:'PUBLISHED',creatorIds:[],topicIds:[],mediaAssetIds:['asset'],sourceId:'test-source'}],media:[{id:'asset',kind:'AUDIO',url:origin+'/media/spoken',sourceId:'test-source',rightsRecordId:'test-rights',durationMs:10000,variantIds:['video']}],variants:[{id:'video',mediaAssetId:'asset',kind:'VIDEO',url:origin+'/media/video'}]};
const bundle=await build({stdin:{contents:'import React from "react";import{createRoot}from"react-dom/client";import{AppShell}from"./components/app-shell";createRoot(document.getElementById("app")).render(<React.StrictMode><AppShell/></React.StrictMode>);',loader:'tsx',resolveDir:process.cwd()},bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'isolated-catalog-fixtures',setup(b){b.onLoad({filter:/[/\\]lib[/\\]spoken-catalog\.ts$/},()=>({contents:'export const SPOKEN_CATALOG='+JSON.stringify(catalog),loader:'ts'}));}}]});
const fixtureSurah={number:1,name:'TEST',englishName:'TEST SURAH',frenchName:'Fixture de test',revelationType:'Meccan',numberOfAyahs:5};
const source={name:'TEST SOURCE',url:origin,termsUrl:origin};
const server=createServer((req,res)=>{let body;res.setHeader('Content-Type','application/json');
 if(req.url==='/bundle.js'){res.setHeader('Content-Type','text/javascript');body=bundle.outputFiles[0].contents;}
 else if(req.url==='/styles.css'){res.setHeader('Content-Type','text/css');body=readFileSync('app/globals.css');}
 else if(req.url?.startsWith('/api/quran/surahs'))body=JSON.stringify({data:[fixtureSurah],source});
 else if(req.url?.startsWith('/api/quran/surah/'))body=JSON.stringify({data:{surah:fixtureSurah,reciterId:'7',reciterName:'Test reciter',source,ayahs:Array.from({length:5},(_,i)=>({number:i+1,numberInSurah:i+1,arabicText:'TEST VERSE '+(i+1),frenchText:'Test translation '+(i+1),audioUrl:origin+'/media/quran/'+(i+1),words:[]}))}});
 else if(req.url?.startsWith('/api/'))body=JSON.stringify({data:[]});
 else{res.setHeader('Content-Type','text/html');body='<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><div id="app"></div><script src="/bundle.js"></script></body></html>';}
 res.end(body);
});
await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
const profile=mkdtempSync(join(tmpdir(),'rihla-browser-'));
const chrome=spawn(process.env.CHROME_BIN||'google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--remote-debugging-port=9222','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let socket;
try{
 let page;for(let i=0;i<100;i++){try{page=await (await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();if(page.webSocketDebuggerUrl)break;}catch{}await sleep(100);}
 assert(page?.webSocketDebuggerUrl,'Chromium must be installed for integration verification');
 socket=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map(),errors=[];
 socket.onmessage=e=>{const message=JSON.parse(e.data);if(message.id){const p=pending.get(message.id);pending.delete(message.id);message.error?p?.reject(new Error(JSON.stringify(message.error))):p?.resolve(message.result);}else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.exception?.description||message.params.exceptionDetails.text);};
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
 const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
 const wait=async expression=>{for(let i=0;i<100;i++){if(errors.length)throw Error(errors.join('\n'));if(await evaluate('Boolean('+expression+')'))return;await sleep(50);}throw Error('Timed out: '+expression+'\n'+await evaluate('document.body.innerText'));};
 const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
 const seed={version:1,favoriteSurahs:[],favoriteAyahs:[],lastSurah:1,lastAyah:1,playlists:[{id:'q',title:'Test sequence',ayahKeys:['1:1','1:3'],spokenContentIds:[],itemOrder:['quran:1:1','quran:1:3'],allowMixedContent:false},{id:'mixed',title:'Test mixed',ayahKeys:['1:1','1:3'],spokenContentIds:['fixture'],itemOrder:['quran:1:1','spoken:fixture','quran:1:3'],allowMixedContent:true}]};
 await cdp('Runtime.enable');await cdp('Page.enable');
 await cdp('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('rihla.library.v1',${JSON.stringify(JSON.stringify(seed))});window.confirm=()=>true;
 window.__media=[];const states=new WeakMap();function state(m){if(!states.has(m)){states.set(m,{src:'',time:0,ready:0,paused:true,ended:false});window.__media.push(m);}return states.get(m);}
 const proto=HTMLMediaElement.prototype;
 Object.defineProperties(proto,{src:{configurable:true,get(){return state(this).src},set(v){state(this).src=new URL(v,location.href).href;state(this).ready=0;state(this).ended=false;}},currentSrc:{configurable:true,get(){return state(this).src}},currentTime:{configurable:true,get(){return state(this).time},set(v){if(!state(this).ready)throw new DOMException('Not ready','InvalidStateError');state(this).time=v;}},duration:{configurable:true,get(){return state(this).ready?10:NaN}},readyState:{configurable:true,get(){return state(this).ready}},paused:{configurable:true,get(){return state(this).paused}},ended:{configurable:true,get(){return state(this).ended}}});
 proto.load=function(){const s=state(this);s.ready=0;s.time=0;s.ended=false;s.paused=true;const source=s.src;if(!source)return;queueMicrotask(()=>{if(s.src!==source)return;s.ready=4;this.dispatchEvent(new Event('loadedmetadata'));this.dispatchEvent(new Event('canplay'));});};
 proto.play=function(){const s=state(this);s.paused=false;s.ended=false;this.dispatchEvent(new Event('play'));queueMicrotask(()=>{if(!s.paused)this.dispatchEvent(new Event('playing'));});return Promise.resolve();};
 proto.pause=function(){const s=state(this);if(!s.paused){s.paused=true;this.dispatchEvent(new Event('pause'));}};
 const remove=proto.removeAttribute;proto.removeAttribute=function(name){if(name==='src')state(this).src='';return remove.call(this,name)};
 window.__playing=()=>window.__media.filter(m=>m.src&&!m.paused);
 window.__finish=()=>{const m=window.__playing()[0];if(!m)throw Error('No active media');const s=state(m);s.time=10;s.paused=true;s.ended=true;m.dispatchEvent(new Event('timeupdate'));m.dispatchEvent(new Event('ended'));return m.src;};
 window.__seek=seconds=>{const m=window.__playing()[0];m.currentTime=seconds;m.dispatchEvent(new Event('timeupdate'));};
 `});
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await cdp('Page.navigate',{url:origin});await wait('document.querySelector(".quran-hero") && window.__media.some(m=>m.readyState>0)');
 const audioCount=await evaluate('window.__media.filter(m=>m instanceof HTMLAudioElement).length');
 const openList=async id=>{await evaluate(`Array.from(document.querySelectorAll('.mobile-navigation button')).find(b=>b.textContent.includes('Bibliothèque')).click()`);await wait('document.querySelector(".library-shortcuts")');await evaluate(`Array.from(document.querySelectorAll('.library-shortcuts button')).find(b=>b.textContent.includes('Playlists')).click()`);await wait('document.querySelector(".playlist-row")');await evaluate(`Array.from(document.querySelectorAll('.playlist-row button')).find(b=>b.textContent.includes(${JSON.stringify(id)})).click()`);await wait('document.querySelector(".playlist-play-all")');};
 await openList('Test sequence');assert.equal(await evaluate('document.querySelectorAll(".playlist-detail").length'),1);
 await click('.playlist-play-all');await wait('window.__playing().length===1 && window.__playing()[0].src.endsWith("/quran/1")');
 await evaluate('window.__seek(4)');await sleep(200);assert.equal(await evaluate('window.__media.filter(m=>m instanceof HTMLAudioElement).length'),audioCount,'React updates must not recreate Audio');
 await evaluate('window.__finish()');await wait('window.__playing().length===1 && window.__playing()[0].src.endsWith("/quran/3")');
 await evaluate('window.__finish()');await wait('!document.querySelector(".playlist-run-bar")');assert.equal(await evaluate('window.__playing().length'),0,'Playlist must stop at selected verse, not finish the whole surah');
 await evaluate('window.__media.filter(m=>m instanceof HTMLAudioElement).at(-1).dispatchEvent(new Event("ended"))');await sleep(100);assert.equal(await evaluate('window.__playing().length'),0,'Late duplicate ended cannot restart Quran');
 console.log('PASS browser: ordered per-ayah playback, persistent Audio, exact end, stale completion ignored');
 await openList('Test mixed');await click('.playlist-play-all');await wait('window.__playing().length===1');await evaluate('window.__finish()');await wait('document.querySelector("#playlist-transition-title")');assert.equal(await evaluate('window.__playing().length'),0,'No automatic family crossing without consent');
 await click('[aria-labelledby="playlist-transition-title"] .primary-action');await wait('document.querySelector(".spoken-player") && window.__playing().length===1 && window.__playing()[0].src.endsWith("/spoken")');
 await evaluate('window.__seek(4)');await click('.media-mode-switch button:last-child');await wait('window.__playing().length===1 && window.__playing()[0].src.endsWith("/video")');assert.equal(await evaluate('window.__playing()[0].currentTime'),4,'Audio/video switch must preserve timestamp');
 await click('.spoken-player .main-player-button');await wait('window.__playing().length===0');await wait('JSON.parse(localStorage.getItem("rihla.library.v1")).spokenProgress[0]?.positionMs===4000');
 await click('.spoken-player .main-player-button');await wait('window.__playing().length===1');await evaluate('window.__finish()');await wait('document.querySelector("#playlist-transition-title")');await click('[aria-labelledby="playlist-transition-title"] .secondary-action');await wait('!document.querySelector(".playlist-run-bar")');assert.equal(await evaluate('window.__playing().length'),0);
 console.log('PASS browser: explicit mixed consent, exclusive transport, video resume, saved pause, stop at boundary');
 await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await sleep(100);assert.deepEqual(errors,[]);console.log('PASS browser: mobile and desktop render without runtime exceptions');
}finally{socket?.close();chrome.kill('SIGTERM');server.close();await sleep(100);rmSync(profile,{recursive:true,force:true});}
