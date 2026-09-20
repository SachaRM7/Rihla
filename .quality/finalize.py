from pathlib import Path
f=Path('hooks/use-quran-player.ts');s=f.read_text()
if 'let endedSource:' not in s:
    s=s.replace('    let lastClockUpdate = 0;','    let lastClockUpdate = 0;\n    let endedSource: string | null = null;')
    s=s.replace('    const onPlay = () => {','    const onPlay = () => {\n      endedSource = null;')
    s=s.replace('    const onEnded = () => {\n      stopClock();','    const onEnded = () => {\n      if (!audio.ended || !ownsPlayback(audio) || endedSource === audio.src) return;\n      endedSource = audio.src;\n      stopClock();')
    s=s.replace('        setCurrentTime(0);\n        onStopAtEndConsumed?.();','        setCurrentTime(Number.isFinite(audio.duration) ? audio.duration : audio.currentTime);\n        onStopAtEndConsumed?.();')
    s=s.replace('        setCurrentTime(0);\n        onSurahEnded?.();','        setCurrentTime(Number.isFinite(audio.duration) ? audio.duration : audio.currentTime);\n        onSurahEnded?.();')
    s=s.replace('  useEffect(() => {\n    const frame = window.requestAnimationFrame(resetStudyLoopProgress);','  useEffect(() => {\n    cancelDelayedPlayback();\n    const frame = window.requestAnimationFrame(resetStudyLoopProgress);')
    s=s.replace('  }, [studyLoop, resetStudyLoopProgress]);','  }, [studyLoop, resetStudyLoopProgress, cancelDelayedPlayback]);')
    f.write_text(s)
f=Path('scripts/test-browser.mjs');s=f.read_text()
s=s.replace('if(await evaluate(expression))return;',"if(await evaluate('Boolean('+expression+')'))return;")
f.write_text(s)
