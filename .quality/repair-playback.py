from pathlib import Path
f=Path('hooks/use-quran-player.ts');s=f.read_text()
s=s.replace('import type { SurahDetail }','import { claimPlayback, ownsPlayback, releasePlayback } from "@/lib/playback-ownership";\nimport type { SurahDetail }')
s=s.replace('  onSurahEnded?: () => void;','  onSurahEnded?: () => void;\n  onAyahEnded?: (key: string) => boolean;')
s=s.replace('  onSurahEnded,\n}: PlayerOptions)', '  onSurahEnded,\n  onAyahEnded,\n}: PlayerOptions)')
s=s.replace('  const playbackRateRef = useRef(playbackRate);','''  const playbackRateRef = useRef(playbackRate);
  const completionRef = useRef({ stopAtEnd, onStopAtEndConsumed, onSurahEnded, onAyahEnded });
  useEffect(() => { completionRef.current = { stopAtEnd, onStopAtEndConsumed, onSurahEnded, onAyahEnded }; }, [stopAtEnd, onStopAtEndConsumed, onSurahEnded, onAyahEnded]);''')
s=s.replace('  const resetRepeatProgress = useCallback','''  const cancelDelayedPlayback = useCallback(() => {
    if (pauseTimeoutRef.current !== null) window.clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = null;
  }, []);

  const resetRepeatProgress = useCallback''')
s=s.replace('    playWhenLoadedRef.current = autoplay;\n    setError(null);','    cancelDelayedPlayback();\n    playWhenLoadedRef.current = autoplay;\n    setError(null);',1)
s=s.replace('  }, [resetRepeatProgress]);\n\n  useEffect(() => {\n    const audio = new Audio();','  }, [cancelDelayedPlayback, resetRepeatProgress]);\n\n  useEffect(() => {\n    const audio = new Audio();')
s=s.replace('    const onPlay = () => {\n      playWhenLoadedRef.current','''    const onPlay = () => {
      claimPlayback(audio, () => { cancelDelayedPlayback(); playWhenLoadedRef.current = false; audio.pause(); });
      playWhenLoadedRef.current''')
s=s.replace('      if (stopAtEnd === "ayah" || (stopAtEnd === "surah"','      const { stopAtEnd, onStopAtEndConsumed, onSurahEnded, onAyahEnded } = completionRef.current;\n      if (stopAtEnd === "ayah" || (stopAtEnd === "surah"')
s=s.replace('      const currentIndex = indexRef.current;\n\n      const moveToIndex','''      const currentIndex = indexRef.current;
      const endedAyah = currentDetail?.ayahs[currentIndex];
      if (currentDetail && endedAyah && onAyahEnded) {
        // Settle the completed source BEFORE a callback can load the next source.
        playWhenLoadedRef.current = false;
        setStatus("paused");
        setCurrentTime(Number.isFinite(audio.duration) ? audio.duration : audio.currentTime);
        if (onAyahEnded(`quran:${currentDetail.surah.number}:${endedAyah.numberInSurah}`)) return;
      }

      const moveToIndex''')
s=s.replace('      audioRef.current = null;','      releasePlayback(audio);\n      audioRef.current = null;')
s=s.replace('  }, [onStopAtEndConsumed, resetRepeatProgress, resetStudyLoopProgress, stopAtEnd]);','  }, [cancelDelayedPlayback, resetRepeatProgress, resetStudyLoopProgress]);')
s=s.replace('  const pause = useCallback(() => {\n    playWhenLoadedRef.current = false;\n    audioRef.current?.pause();\n  }, []);','''  const pause = useCallback(() => {
    cancelDelayedPlayback();
    playWhenLoadedRef.current = false;
    audioRef.current?.pause();
  }, [cancelDelayedPlayback]);''')
s=s.replace('if (status === "playing") pause();','if (status === "playing" || status === "buffering") pause();')
s=s.replace('      const currentDetail = detailRef.current;\n      if (!currentDetail || index < 0','      cancelDelayedPlayback();\n      const currentDetail = detailRef.current;\n      if (!currentDetail || index < 0')
s=s.replace('    [loadAtIndex, play],','    [cancelDelayedPlayback, loadAtIndex, play],')
s=s.replace('  const retry = useCallback(() => loadAtIndex(indexRef.current, true), [loadAtIndex]);','''  const retry = useCallback(() => {
    const audio = audioRef.current;
    const position = audio?.currentTime ?? 0;
    const restore = () => { if (audio && Number.isFinite(audio.duration)) audio.currentTime = Math.min(position, audio.duration); };
    audio?.addEventListener("loadedmetadata", restore, { once: true });
    audio?.load();
    play();
  }, [play]);''')
s=s.replace('if (!audio || typeof navigator === "undefined"','if (!audio || !ownsPlayback(audio) || typeof navigator === "undefined"')
s=s.replace('    if (!detail || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;','    if (!detail || !audioRef.current || !ownsPlayback(audioRef.current) || typeof MediaMetadata === "undefined" || !("mediaSession" in navigator)) return;')
s=s.replace('  }, [activeIndex, detail, next, pause, play, previous]);','  }, [activeIndex, detail, next, pause, play, previous, status]);')
s=s.replace('    navigator.mediaSession.metadata = new MediaMetadata({','    const ownedAudio = audioRef.current;\n    const setAction = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => { try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* optional OS control */ } };\n    navigator.mediaSession.metadata = new MediaMetadata({')
a=s.index('    const ownedAudio =');s=s[:a]+s[a:].replace('navigator.mediaSession.setActionHandler("','setAction("')
s=s.replace('    return () => {\n      setAction("play", null);','    return () => {\n      if (!ownedAudio || !ownsPlayback(ownedAudio)) return;\n      setAction("play", null);')
f.write_text(s)
f=Path('components/app-shell.tsx');s=f.read_text()
s=s.replace('import { useLocalLibrary,','import { nextPlaylistRun, startPlaylistRun, type PlaylistRun } from "@/lib/playlist-integrity";\nimport { useLocalLibrary,')
s=s.replace('useState<{playlistId:string;index:number}|null>(null)','useState<PlaylistRun | null>(null)')
s=s.replace('  const [spokenNowPlaying,','''  const playlistRunRef = useRef<PlaylistRun | null>(null);
  const runTokenRef = useRef(0);
  const [pendingPlaylistTransition, setPendingPlaylistTransition] = useState<PlaylistRun | null>(null);
  const updatePlaylistRun = useCallback((run: PlaylistRun | null) => {
    playlistRunRef.current = run;
    setActivePlaylistRun(run);
  }, []);
  const [spokenNowPlaying,''')
s=s.replace('asset: MediaAsset } | null>(null)','asset: MediaAsset; sessionId: number } | null>(null)')
s=s.replace('    onSurahEnded: () => { if (activePlaylistRun) advancePlaylist(); },','''    onAyahEnded: (key) => {
      const run = playlistRunRef.current;
      if (!run || run.items[run.index] !== key) return false;
      advancePlaylist(key, run.token);
      return true;
    },''')
s=s.replace('onStopAtEndConsumed: () => setSleepAtEnd(null),','onStopAtEndConsumed: () => { setSleepAtEnd(null); updatePlaylistRun(null); setPendingPlaylistTransition(null); },')
s=s.replace('      if (remaining === 0) {\n        pausePlayback();','      if (remaining === 0) {\n        updatePlaylistRun(null);\n        setPendingPlaylistTransition(null);\n        pausePlayback();')
s=s.replace('const openSurah = useCallback((number: number, ayah?: number, positionMs = 0, autoplay = false) => {','''const openSurah = useCallback((number: number, ayah?: number, positionMs = 0, autoplay = false, fromPlaylist = false) => {
    if (!fromPlaylist) { updatePlaylistRun(null); setPendingPlaylistTransition(null); }
    if (autoplay) setSpokenNowPlaying(null);''')
s=s.replace('[activeIndex, detail, loadedSourceUrl, playPlayback, seekPlayback, selectPlaybackAyah]);','[activeIndex, detail, loadedSourceUrl, playPlayback, seekPlayback, selectPlaybackAyah, updatePlaylistRun]);')
a=s.index('  const playPlaylistItem =');b=s.index('  const featuredSurahs =',a)
s=s[:a]+'''  const playSpokenContent = (content: ContentItem, fromPlaylist = false) => {
    if (!fromPlaylist) { updatePlaylistRun(null); setPendingPlaylistTransition(null); }
    if (!spokenContents.some(item => item.id === content.id)) { setShareMessage("Ce contenu n’est plus disponible."); return; }
    const asset = content.mediaAssetIds.map(id => SPOKEN_CATALOG.media.find(item => item.id === id)).find((item): item is MediaAsset => Boolean(item));
    if (!asset) { setShareMessage("Aucun média disponible."); return; }
    pausePlayback();
    setPlayerOpen(false);
    const preferred = preferredMediaVariant(asset, SPOKEN_CATALOG.variants ?? [], library.audioQuality);
    setSpokenNowPlaying({ content, asset: preferred ? { ...asset, url: preferred.url } : asset, sessionId: ++runTokenRef.current });
  };
  const playPlaylistItem = (playlistId: string, index: number, snapshot?: PlaylistRun) => {
    const playlist = library.playlists.find(item => item.id === playlistId);
    if (!playlist) { updatePlaylistRun(null); return; }
    const run = snapshot ? { ...snapshot, index, token: ++runTokenRef.current } : startPlaylistRun(playlist, index, ++runTokenRef.current);
    const key = run?.items[index];
    if (!run || !key) return;
    setPendingPlaylistTransition(null);
    updatePlaylistRun(run);
    if (key.startsWith("quran:")) {
      pausePlayback();
      setSpokenNowPlaying(null);
      setRepeatMode("off");
      setStudyLoop(null);
      const [surah, ayah] = key.slice(6).split(":").map(Number);
      openSurah(surah, ayah, 0, true, true);
    } else {
      const content = spokenContents.find(item => item.id === key.slice(7));
      if (content) playSpokenContent(content, true);
      else { updatePlaylistRun(null); setShareMessage("Lecture arrêtée : un contenu de cette playlist est indisponible."); }
    }
  };
  const advancePlaylist = (finishedKey: string, token: number) => {
    const run = playlistRunRef.current;
    if (!run || run.token !== token) return;
    const playlist = library.playlists.find(item => item.id === run.playlistId);
    if (!playlist) { updatePlaylistRun(null); return; }
    const next = nextPlaylistRun(run, finishedKey, playlist.allowMixedContent && library.allowCrossFamilyAutoAdvance);
    if (next.type === "stale") return;
    playlistRunRef.current = { ...run, token: -1 };
    if (next.type === "end") { updatePlaylistRun(null); setShareMessage("Playlist terminée."); }
    else if (next.type === "consent") setPendingPlaylistTransition({ ...run, index: run.index + 1 });
    else if (next.run) playPlaylistItem(run.playlistId, next.run.index, next.run);
  };

'''+s[b:]
s=s.replace('        content={spokenNowPlaying.content}','        key={spokenNowPlaying.sessionId}\n        content={spokenNowPlaying.content}')
s=s.replace('        onEnded={advancePlaylist}','        onEnded={() => { const run = playlistRunRef.current; if (run) advancePlaylist(`spoken:${spokenNowPlaying.content.id}`, run.token); }}\n        onSleepStop={() => { updatePlaylistRun(null); setPendingPlaylistTransition(null); }}')
s=s.replace('onClose={() => setSpokenNowPlaying(null)}','onClose={() => { setSpokenNowPlaying(null); updatePlaylistRun(null); setPendingPlaylistTransition(null); }}')
s=s.replace('setActivePlaylistRun(null);pausePlayback();setSpokenNowPlaying(null);','updatePlaylistRun(null);setPendingPlaylistTransition(null);pausePlayback();setSpokenNowPlaying(null);')
s=s.replace('{activePlaylistRun.index+1} / {playlist.itemOrder.length}','{activePlaylistRun.index+1} / {activePlaylistRun.items.length}')
s=s.replace('activePlaylistRun.index>=playlist.itemOrder.length-1','activePlaylistRun.index>=activePlaylistRun.items.length-1')
s=s.replace('playPlaylistItem(playlist.id,activePlaylistRun.index-1)','playPlaylistItem(playlist.id,activePlaylistRun.index-1,activePlaylistRun)')
s=s.replace('playPlaylistItem(playlist.id,activePlaylistRun.index+1)','playPlaylistItem(playlist.id,activePlaylistRun.index+1,activePlaylistRun)')
s=s.replace(')) deletePlaylist(playlist.id);',')) { if (playlistRunRef.current?.playlistId === playlist.id) { updatePlaylistRun(null); setPendingPlaylistTransition(null); pausePlayback(); setSpokenNowPlaying(null); } deletePlaylist(playlist.id); }')
s=s.replace('import { TafsirDialog }','import { PlaylistTransitionDialog } from "@/components/playlist-transition-dialog";\nimport { TafsirDialog }')
s=s.replace('      {noteTarget && (','''      {pendingPlaylistTransition && <PlaylistTransitionDialog
        onClose={() => { setPendingPlaylistTransition(null); updatePlaylistRun(null); }}
        onConfirm={() => playPlaylistItem(pendingPlaylistTransition.playlistId, pendingPlaylistTransition.index, pendingPlaylistTransition)}
      />}

      {noteTarget && (''')
f.write_text(s)
for base in ('app','components','hooks','lib','scripts'):
    for path in Path(base).rglob('*'):
        if path.suffix in ('.ts','.tsx','.mjs'):
            data=path.read_text();clean='\n'.join(x.rstrip() for x in data.splitlines())+'\n'
            if clean!=data: path.write_text(clean)
