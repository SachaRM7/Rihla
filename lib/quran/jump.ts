export type QuranJumpTarget =
  | { kind: "SURAH"; surah: number; ayah: number }
  | { kind: "JUZ"; juz: number }
  | { kind: "HIZB"; hizb: number };

export function parseQuranJump(value: string): QuranJumpTarget | null {
  const input = value.trim().toLocaleLowerCase("fr").replace(/\s+/g, " ");
  const reference = input.match(/^(\d{1,3})(?::(\d{1,3}))?$/);
  if (reference) {
    const surah = Number(reference[1]);
    const ayah = Number(reference[2] ?? 1);
    return surah >= 1 && surah <= 114 && ayah >= 1 ? { kind: "SURAH", surah, ayah } : null;
  }
  const juz = input.match(/^(?:juz|juz'|juzz)\s*(\d{1,2})$/);
  if (juz) { const number = Number(juz[1]); return number >= 1 && number <= 30 ? { kind: "JUZ", juz: number } : null; }
  const hizb = input.match(/^hizb\s*(\d{1,2})$/);
  if (hizb) { const number = Number(hizb[1]); return number >= 1 && number <= 60 ? { kind: "HIZB", hizb: number } : null; }
  return null;
}
