from pathlib import Path
f=Path('components/app-shell.tsx');s=f.read_text()
s=s.replace('    removeHistoryItem,\n    removeSpokenProgress,','    removeHistoryItem,')
f.write_text(s)
