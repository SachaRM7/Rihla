from pathlib import Path
root=Path('.')
def edit(path, fn):
    f=root/path; before=f.read_text(); after=fn(before)
    if before==after: raise RuntimeError('Expected edit missing: '+path)
    f.write_text(after)
def once(s,a,b):
    if s.count(a)!=1: raise RuntimeError('Expected exactly one target: '+a[:100])
    return s.replace(a,b,1)
def shell(s):
    s=once(s,'onClick={()=>playPlaylistItem(playlist.id,0)}}>','onClick={()=>playPlaylistItem(playlist.id,0)}>')
    a=s.index('              {librarySection === "playlists" && selectedPlaylistId && (() => {')
    b=s.index('              {(librarySection === "all" || librarySection === "history")',a)
    s=s[:a]+s[b:]
    s=s.replace('  Wifi,\n','  Wifi,\n  WifiOff,\n')
    s=s.replace('    toggleAyahInPlaylist,\n','    toggleAyahInPlaylist,\n    toggleSpokenInPlaylist,\n    setPlaylistMixedContent,\n    duplicatePlaylist,\n')
    s=s.replace('                        autoScroll={library.autoScroll}\n                showTranslation={library.showTranslation}','                        autoScroll={library.autoScroll}')
    s=s.replace('                autoScroll={library.autoScroll}\n                onThemeChange=', '                autoScroll={library.autoScroll}\n                showTranslation={library.showTranslation}\n                onThemeChange=')
    s=s.replace('                        setInitialAyah(ayahNumber);\n                        setInitialPositionMs(0);\n                        setInitialAutoplay(player.isPlaying);','                        requestedAyahRef.current = ayahNumber;\n                        requestedPositionRef.current = 0;\n                        requestedAutoplayRef.current = player.isPlaying;')
    s=s.replace('setDownloadStates((current)=>({...current,[item.id]:"QUEUED"})); setShareMessage("Téléchargement prêt · stockage hors connexion à connecter");','setShareMessage("Le téléchargement hors connexion n’est pas encore disponible.");')
    s=s.replace('onReportIssue={() => setShareMessage("Signalement enregistré localement · envoi serveur à connecter")}','')
    s=s.replace('if (target.surah < 1', 'if (target.kind !== "SURAH") { showShareMessage("Cette division nécessite un index coranique vérifié."); return; }\n                if (target.surah < 1')
    return s
edit('components/app-shell.tsx',shell)
def library(s):
    s=s.replace('import type { QueueEntry }','import { normalizePlaylists, togglePlaylistItem, removePlaylistItem, movePlaylistEntry } from "@/lib/playlist-integrity";\nimport type { QueueEntry }')
    a=s.index('    playlists: Array.isArray(candidate.playlists)');b=s.index('\n    quranReadingSurah:',a)
    s=s[:a]+'    playlists: normalizePlaylists(candidate.playlists),'+s[b:]
    a=s.index('  const removeSpokenProgress =');a=s.index('  const removeSpokenProgress =',a+1)
    b=s.index('  const setHistoryEnabled =',a);s=s[:a]+s[b:]
    s=s.replace('    removeHistoryItem,\n    removeSpokenProgress,','    removeHistoryItem,')
    a=s.index('  const toggleSpokenInPlaylist =');b=s.index('  const duplicatePlaylist =',a)
    s=s[:a]+'''  const toggleSpokenInPlaylist = useCallback((playlistId: string, contentId: string) => {
    setLibrary(current => ({ ...current, playlists: current.playlists.map(p => p.id === playlistId ? togglePlaylistItem(p, `spoken:${contentId}`) : p) }));
  }, []);

'''+s[b:]
    a=s.index('  const toggleAyahInPlaylist =');b=s.index('  const importData =',a)
    s=s[:a]+'''  const toggleAyahInPlaylist = useCallback((playlistId: string, surah: number, ayah: number) => {
    setLibrary(current => ({ ...current, playlists: current.playlists.map(p => p.id === playlistId ? togglePlaylistItem(p, `quran:${surah}:${ayah}`) : p) }));
  }, []);

'''+s[b:]
    s=s.replace('      const parsed = JSON.parse(raw);\n      const restored', '      const parsed = JSON.parse(raw);\n      if (!parsed || Array.isArray(parsed) || parsed.version !== 1 || !Array.isArray(parsed.favoriteSurahs) || !Array.isArray(parsed.favoriteAyahs)) return false;\n      const restored')
    a=s.index('  const removeAyahFromPlaylist =');b=s.index('  const renamePlaylist =',a)
    s=s[:a]+'''  const removeAyahFromPlaylist = useCallback((playlistId: string, key: string) => {
    setLibrary(current => ({ ...current, playlists: current.playlists.map(p => p.id === playlistId ? removePlaylistItem(p, `quran:${key}`) : p) }));
  }, []);

'''+s[b:]
    a=s.index('  const movePlaylistItem =');b=s.index('  const deletePlaylist =',a)
    s=s[:a]+'''  const movePlaylistItem = useCallback((playlistId: string, from: number, to: number) => {
    setLibrary(current => ({ ...current, playlists: current.playlists.map(p => p.id === playlistId ? movePlaylistEntry(p, from, to) : p) }));
  }, []);
  const movePlaylistAyah = useCallback((playlistId: string, from: number, to: number) => {
    setLibrary(current => ({ ...current, playlists: current.playlists.map(p => {
      if (p.id !== playlistId) return p;
      return movePlaylistEntry(p, p.itemOrder.indexOf(`quran:${p.ayahKeys[from]}`), p.itemOrder.indexOf(`quran:${p.ayahKeys[to]}`));
    }) }));
  }, []);

'''+s[b:]
    s=s.replace(r'/^([01]\\d|2[0-3]):[0-5]\\d$/',r'/^([01]\d|2[0-3]):[0-5]\d$/')
    return s
edit('hooks/use-local-library.ts',library)
edit('lib/playback.ts',lambda s:s.replace('allowCrossFamilyAutoAdvance: false;','allowCrossFamilyAutoAdvance: boolean;'))
def ayah(s):
    line=next(x for x in s.splitlines() if '<TranslationCompare primary=' in x)
    s=s.replace(line+'\n','')
    return s.replace('              {memorizationMode && <button',line.replace('{detail.source.translationAuthor &&','{showTranslation && detail.source.translationAuthor &&')+'\n              {memorizationMode && <button')
edit('components/ayah-list.tsx',ayah)
edit('lib/media-variants.ts',lambda s:s.replace('return variants.filter((variant) => asset.variantIds?.includes(variant.id));','return variants.filter((variant) => variant.mediaAssetId === asset.id && asset.variantIds?.includes(variant.id));'))
