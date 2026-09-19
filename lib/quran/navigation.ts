export type QuranDivisionKind = "juz" | "hizb";

export type QuranDivisionTarget = {
  kind: QuranDivisionKind;
  number: number;
  surah: number;
  ayah: number;
};

// Canonical starting references for the 30 juz.
export const JUZ_STARTS: Array<[number, number]> = [
  [1,1],[2,142],[2,253],[3,93],[4,24],[4,148],[5,82],[6,111],[7,88],[8,41],
  [9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],
  [29,46],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1],
];

export function resolveJuz(number: number): QuranDivisionTarget | null {
  if (!Number.isInteger(number) || number < 1 || number > 30) return null;
  const start = JUZ_STARTS[number - 1];
  return { kind: "juz", number, surah: start[0], ayah: start[1] };
}

export function resolveHizb(number: number): QuranDivisionTarget | null {
  if (!Number.isInteger(number) || number < 1 || number > 60) return null;
  // Every hizb starts at one of the two half-juz boundaries. The first half
  // starts at the juz boundary; the second half is resolved from a compact map.
  const SECOND_HALF: Array<[number, number]> = [
    [2,75],[2,202],[3,15],[3,171],[4,88],[5,27],[6,36],[7,31],[8,1],[9,36],
    [11,84],[13,19],[16,51],[18,1],[18,98],[21,51],[23,78],[26,2],[28,31],[30,1],
    [34,24],[37,22],[40,41],[43,24],[48,18],[53,31],[57,29],[62,1],[72,1],[87,1],
  ];
  const juz = Math.ceil(number / 2);
  const start = number % 2 === 1 ? JUZ_STARTS[juz - 1] : SECOND_HALF[juz - 1];
  return start ? { kind: "hizb", number, surah: start[0], ayah: start[1] } : null;
}

export function parseQuranJump(value: string) {
  const normalized = value.trim().toLocaleLowerCase("fr").replace(/\s+/g, " ");
  const juz = normalized.match(/^(?:juz|juz'|juzz)\s*(\d{1,2})$/);
  if (juz) return resolveJuz(Number(juz[1]));
  const hizb = normalized.match(/^hizb\s*(\d{1,2})$/);
  if (hizb) return resolveHizb(Number(hizb[1]));
  const reference = normalized.match(/^(\d{1,3})(?::(\d{1,3}))?$/);
  if (reference) return { kind: "ayah" as const, surah: Number(reference[1]), ayah: Number(reference[2] ?? 1) };
  return null;
}
