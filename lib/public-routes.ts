export type PublicRoute =
  | { kind: "home" }
  | { kind: "quran"; surah: number; ayah?: number }
  | { kind: "content"; slug: string }
  | { kind: "series"; slug: string }
  | { kind: "creator"; slug: string }
  | { kind: "collection"; slug: string };

function safeDecode(value: string) {
  try { return decodeURIComponent(value); } catch { return value; }
}

function validSurah(value: string | undefined) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 114 ? number : null;
}

function validAyah(value: string | undefined) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 286 ? number : null;
}

export function parsePublicRoute(pathname: string, search = ""): PublicRoute {
  const parts = pathname.split("/").filter(Boolean).map(safeDecode);
  if (parts[0] === "quran") {
    const surah = validSurah(parts[1]);
    if (surah !== null) {
      const ayah = validAyah(parts[2]);
      return ayah === null ? { kind: "quran", surah } : { kind: "quran", surah, ayah };
    }
  }
  if (parts[0] === "content" && parts[1]) return { kind: "content", slug: parts[1] };
  if (parts[0] === "series" && parts[1]) return { kind: "series", slug: parts[1] };
  if (parts[0] === "creator" && parts[1]) return { kind: "creator", slug: parts[1] };
  if (parts[0] === "collection" && parts[1]) return { kind: "collection", slug: parts[1] };
  const params = new URLSearchParams(search);
  const linkedView = params.get("view");
  if (linkedView === "search" || linkedView === "quran" || linkedView === "library" || linkedView === "settings") {
    return linkedView === "quran" ? { kind: "quran", surah: validSurah(params.get("surah") ?? "") ?? 1 } : { kind: "home" };
  }
  return { kind: "home" };
}

export function publicRoutePath(route: PublicRoute) {
  if (route.kind === "home") return "/";
  if (route.kind === "quran") return `/quran/${route.surah}${route.ayah ? `/${route.ayah}` : ""}`;
  return `/${route.kind}/${encodeURIComponent(route.slug)}`;
}
