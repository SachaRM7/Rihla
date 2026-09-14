"use client";

import { ChevronDown, Play, Repeat2, Square } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  STUDY_LOOP_CYCLES,
  type StudyLoopCycles,
  type StudyLoopPreference,
} from "@/lib/preferences";

type Props = {
  surahNumber: number;
  ayahCount: number;
  activeAyah: number;
  value: StudyLoopPreference | null;
  iteration: number;
  onApply: (value: StudyLoopPreference) => void;
  onStop: () => void;
};

const CYCLE_LABELS: Record<StudyLoopCycles, string> = {
  "3": "3 passages",
  "5": "5 passages",
  "10": "10 passages",
  continuous: "En continu",
};

export function StudyLoopControl({
  surahNumber,
  ayahCount,
  activeAyah,
  value,
  iteration,
  onApply,
  onStop,
}: Props) {
  const [expanded, setExpanded] = useState(Boolean(value));
  const [startAyah, setStartAyah] = useState(value?.startAyah ?? activeAyah);
  const [endAyah, setEndAyah] = useState(value?.endAyah ?? Math.min(ayahCount, activeAyah + 2));
  const [cycles, setCycles] = useState<StudyLoopCycles>(value?.cycles ?? "3");
  const ayahNumbers = useMemo(
    () => Array.from({ length: ayahCount }, (_, index) => index + 1),
    [ayahCount],
  );

  useEffect(() => {
    if (!value) return;
    setStartAyah(value.startAyah);
    setEndAyah(value.endAyah);
    setCycles(value.cycles);
    setExpanded(true);
  }, [value]);

  const toggleExpanded = () => {
    setExpanded((current) => {
      if (!current && !value) {
        setStartAyah(activeAyah);
        setEndAyah(Math.min(ayahCount, activeAyah + 2));
      }
      return !current;
    });
  };

  return (
    <section className={`study-loop ${value ? "active" : ""}`} aria-label="Boucle d’étude A à B">
      <button
        type="button"
        className="study-loop-toggle"
        onClick={toggleExpanded}
        aria-expanded={expanded}
      >
        <span className="study-loop-symbol"><Repeat2 size={18} /></span>
        <span>
          <strong>Boucle d’étude A–B</strong>
          <small>
            {value
              ? `Ayat ${value.startAyah} à ${value.endAyah} · ${value.cycles === "continuous" ? `passage ${iteration}` : `passage ${iteration}/${value.cycles}`}`
              : "Répéter une plage pour mémoriser"}
          </small>
        </span>
        <ChevronDown className={expanded ? "expanded" : ""} size={18} />
      </button>

      {expanded && (
        <div className="study-loop-panel">
          <div className="study-loop-fields">
            <label>
              <span>Début</span>
              <select
                value={startAyah}
                onChange={(event) => {
                  const nextStart = Number(event.target.value);
                  setStartAyah(nextStart);
                  if (endAyah < nextStart) setEndAyah(nextStart);
                }}
              >
                {ayahNumbers.map((number) => <option value={number} key={number}>Ayah {number}</option>)}
              </select>
            </label>
            <label>
              <span>Fin</span>
              <select value={endAyah} onChange={(event) => setEndAyah(Number(event.target.value))}>
                {ayahNumbers.filter((number) => number >= startAyah).map((number) => (
                  <option value={number} key={number}>Ayah {number}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Cycles</span>
              <select value={cycles} onChange={(event) => setCycles(event.target.value as StudyLoopCycles)}>
                {STUDY_LOOP_CYCLES.map((cycle) => (
                  <option value={cycle} key={cycle}>{CYCLE_LABELS[cycle]}</option>
                ))}
              </select>
            </label>
          </div>
          <p>La lecture revient à l’ayah {startAyah} après l’ayah {endAyah}.</p>
          <div className="study-loop-actions">
            {value && (
              <button type="button" className="secondary-action study-loop-stop" onClick={onStop}>
                <Square size={14} fill="currentColor" /> Arrêter
              </button>
            )}
            <button
              type="button"
              className="primary-action"
              onClick={() => onApply({ surah: surahNumber, startAyah, endAyah, cycles })}
            >
              <Play size={15} fill="currentColor" /> {value ? "Relancer" : "Lancer la boucle"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
