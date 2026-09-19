"use client";

import { useState } from "react";
import type { AyahTranslation } from "@/lib/quran/types";

type Props = { primary: AyahTranslation; alternatives: AyahTranslation[] };

export function TranslationCompare({ primary, alternatives }: Props) {
  const [open,setOpen]=useState(false);
  if(!alternatives.length) return <small className="translation-credit">{primary.author}</small>;
  return <div className="translation-compare">
    <button type="button" className="text-action" onClick={()=>setOpen(!open)} aria-expanded={open}>{open?"Fermer la comparaison":"Comparer les traductions"}</button>
    {open && <div className="translation-options">{[primary,...alternatives].map((item)=><article key={item.id}><p>{item.text}</p><footer><strong>{item.name}</strong><span>{item.author}</span></footer></article>)}</div>}
  </div>;
}
