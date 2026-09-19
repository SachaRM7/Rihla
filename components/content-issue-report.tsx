"use client";

import { Flag } from "lucide-react";
import { useState } from "react";

type IssueKind = "TEXT" | "TIMING" | "SOURCE" | "UNAVAILABLE";
type Props = { onReport: (kind: IssueKind, note?: string) => void };

export function ContentIssueReport({ onReport }: Props) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<IssueKind>("TEXT");
  const [note, setNote] = useState("");
  if (!open) return <button type="button" className="text-action report-trigger" onClick={() => setOpen(true)}><Flag size={14}/>Signaler un problème</button>;
  return <div className="issue-report">
    <label><span>Type</span><select value={kind} onChange={(e)=>setKind(e.target.value as IssueKind)}><option value="TEXT">Erreur de texte</option><option value="TIMING">Mauvais minutage</option><option value="SOURCE">Source incorrecte</option><option value="UNAVAILABLE">Contenu indisponible</option></select></label>
    <label><span>Précision facultative</span><textarea value={note} onChange={(e)=>setNote(e.target.value)} maxLength={500}/></label>
    <div><button type="button" className="secondary-action" onClick={()=>setOpen(false)}>Annuler</button><button type="button" className="primary-action" onClick={()=>{onReport(kind,note.trim()||undefined);setOpen(false);setNote("");}}>Envoyer</button></div>
  </div>;
}
