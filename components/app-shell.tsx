"use client";

import {
  BookOpenText,
  Bookmark,
  ChevronRight,
  Heart,
  Home,
  History,
  Library,
  ListMusic,
  Plus,
  LoaderCircle,
  Play,
  Search,
  Settings,
  StickyNote,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AyahList } from "@/components/ayah-list";
import { AyahNoteDialog } from "@/components/ayah-note-dialog";
import { FullPlayer } from "@/components/full-player";
import { MiniPlayer } from "@/components/mini-player";
import { MobileNavigation, type AppView } from "@/components/mobile-navigation";
import { PreferencesPanel } from "@/components/preferences-panel";
import { QuranSearchResults } from "@/components/quran-search-results";
import { SourceDisclosure } from "@/components/source-disclosure";
import { SurahBrowser } from "@/components/surah-browser";
import { useLocalLibrary, type ListeningHistoryItem } from "@/hooks/use-local-library";
import { useQuranPlayer } from "@/hooks/use-quran-player";
import { DEFAULT_RECITER_ID, RECITERS } from "@/lib/quran/constants";
import type {
  ApiErrorResponse,
  SurahCatalogResponse,
  SurahDetail,
  SurahDetailResponse,
  SurahSummary,
} from "@/lib/quran/types";

const FEATURED_SURAHS = [1, 18, 36, 55, 67, 112];
const THEME_COLORS = {
  olive: "#0a0c0a",
  rose: "#0f0a0d",
  orange: "#0e0b08",
  violet: "#0c0a10",
} as const;

function formatPlaybackTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatHistoryDate(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Aujourd’hui";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
}

function isValidReciter(id: string) {
  return RECITERS.some((reciter) => reciter.id === id);
}

function DesktopNavigation({
  activeView,
  onChange,
}: {
  activeView: AppView;
  onChange: (view: AppView) => void;
}) {
  const items = [
    { id: "home" as const, label: "Accueil", icon: Home },
    { id: "search" as const, label: "Recherche", icon: Search },
    { id: "quran" as const, label: "Le Coran", icon: BookOpenText },
    { id: "library" as const, label: "Bibliothèque", icon: Library },
  ];

  return (
    <aside className="desktop-sidebar">
      <button type="button" className="brand" onClick={() => onChange("home")} aria-label="RIHLA, accueil">
        <span className="brand-mark" aria-hidden="true">ر</span>
        <span><strong>RIHLA</strong><small>Écouter · Lire · Comprendre</small></span>
      </button>
      <nav aria-label="Navigation principale">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={activeView === id ? "active" : ""}
            aria-current={activeView === id ? "page" : undefined}
            onClick={() => onChange(id)}
          >
            <Icon size={19} aria-hidden="true" /><span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export function AppShell() {
  const {
    library,
    hydrated,
    toggleFavoriteSurah,
    toggleFavoriteAyah,
    saveResume,
    savePlaybackProgress,
    setTheme,
    setAppearance,
    setReadingSize,
    setTranslationSize,
    setAutoScroll,
    setPlaybackRate,
    setRepeatMode,
    setShowTranslation,
    setStudyLoop,
    saveAyahNote,
    createPlaylist,
    exportData,
    clearHistory,
    setHistoryEnabled,
    clearPersonalData,
  } = useLocalLibrary();

  const libraryRef = useRef(library);

  useEffect(() => {
    libraryRef.current = library;
  }, [library]);

  useEffect(() => {
    document.documentElement.dataset.theme = library.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[library.theme]);
  }, [library.theme]);

  useEffect(() => {
    document.documentElement.dataset.readingSize = library.readingSize;
    document.documentElement.dataset.translationSize = library.translationSize;
  }, [library.readingSize, library.translationSize]);

  useEffect(() => {
    const root = document.documentElement;
    const applyAppearance = () => {
      const resolved = library.appearance === "system"
        ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
        : library.appearance;
      root.dataset.appearance = resolved;
    };
    applyAppearance();
    const media = window.matchMedia("(prefers-color-scheme: light)");
    media.addEventListener("change", applyAppearance);
    return () => media.removeEventListener("change", applyAppearance);
  }, [library.appearance]);

  const [activeView, setActiveView] = useState<AppView>("home");
  const [surahs, setSurahs] = useState<SurahSummary[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogAttempt, setCatalogAttempt] = useState(0);

  const [selectedNumber, setSelectedNumber] = useState(1);
  const [reciterId, setReciterId] = useState(DEFAULT_RECITER_ID);
  const [detail, setDetail] = useState<SurahDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailAttempt, setDetailAttempt] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [continuousQuran, setContinuousQuran] = useState(false);
  const [librarySection, setLibrarySection] = useState<"all" | "favorites" | "bookmarks" | "notes" | "history" | "playlists">("all");
  const [playerOpen, setPlayerOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [sleepTimerEndsAt, setSleepTimerEndsAt] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(0);
  const [noteTarget, setNoteTarget] = useState<{
    surah: number;
    ayah: number;
    surahName: string;
  } | null>(null);
  const shareTimerRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  const requestedAyahRef = useRef<number | null>(null);
  const requestedPositionRef = useRef<number | null>(null);
  const requestedAutoplayRef = useRef(false);

  useEffect(() => {
    if (!hydrated || initializedRef.current) return;
    initializedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const linkedSurah = Number(params.get("surah"));
    const linkedAyah = Number(params.get("ayah"));
    const linkedTimeValue = params.get("t");
    const linkedTime = linkedTimeValue === null ? 0 : Number(linkedTimeValue);
    const hasValidLink =
      Number.isInteger(linkedSurah) && linkedSurah >= 1 && linkedSurah <= 114 &&
      Number.isInteger(linkedAyah) && linkedAyah >= 1 && linkedAyah <= 286 &&
      Number.isFinite(linkedTime) && linkedTime >= 0 && linkedTime <= 86_400;

    setSelectedNumber(hasValidLink ? linkedSurah : library.lastSurah);
    setReciterId(isValidReciter(library.reciterId) ? library.reciterId : DEFAULT_RECITER_ID);
    requestedAyahRef.current = hasValidLink ? linkedAyah : null;
    requestedPositionRef.current = hasValidLink ? linkedTime * 1000 : library.lastPositionMs;
    if (hasValidLink) window.requestAnimationFrame(() => setActiveView("quran"));
  }, [hydrated, library.lastPositionMs, library.lastSurah, library.reciterId]);

  useEffect(() => () => {
    if (shareTimerRef.current !== null) window.clearTimeout(shareTimerRef.current);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCatalog() {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const response = await fetch("/api/quran/surahs", { signal: controller.signal });
        const payload = (await response.json()) as SurahCatalogResponse | ApiErrorResponse;
        if (!response.ok || !("data" in payload)) {
          throw new Error("error" in payload ? payload.error : "Réponse invalide.");
        }
        setSurahs(payload.data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setCatalogError(error instanceof Error ? error.message : "Le catalogue est indisponible.");
      } finally {
        if (!controller.signal.aborted) setCatalogLoading(false);
      }
    }

    void loadCatalog();
    return () => controller.abort();
  }, [catalogAttempt]);

  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();

    async function loadDetail() {
      setDetailLoading(true);
      setDetailError(null);
      setDetail(null);
      try {
        const response = await fetch(
          `/api/quran/surah/${selectedNumber}?reciter=${encodeURIComponent(reciterId)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as SurahDetailResponse | ApiErrorResponse;
        if (!response.ok || !("data" in payload)) {
          throw new Error("error" in payload ? payload.error : "Réponse invalide.");
        }

        const desiredAyah =
          requestedAyahRef.current ??
          (libraryRef.current.lastSurah === selectedNumber ? libraryRef.current.lastAyah : 1);
        requestedAyahRef.current = null;
        const nextIndex = Math.max(
          0,
          payload.data.ayahs.findIndex((ayah) => ayah.numberInSurah === desiredAyah),
        );
        setActiveIndex(nextIndex);
        setDetail(payload.data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setDetailError(error instanceof Error ? error.message : "Cette sourate est indisponible.");
      } finally {
        if (!controller.signal.aborted) setDetailLoading(false);
      }
    }

    void loadDetail();
    return () => controller.abort();
  }, [detailAttempt, hydrated, reciterId, selectedNumber]);

  const onActiveIndexChange = useCallback((index: number) => setActiveIndex(index), []);
  const player = useQuranPlayer({
    detail,
    activeIndex,
    onActiveIndexChange,
    playbackRate: library.playbackRate,
    repeatMode: library.repeatMode,
    studyLoop: library.studyLoop,
  });
  const {
    loadedSourceUrl,
    pause: pausePlayback,
    play: playPlayback,
    seek: seekPlayback,
    selectAyah: selectPlaybackAyah,
  } = player;

  const setSleepTimer = useCallback((minutes: number | null) => {
    if (minutes === null) {
      setSleepTimerEndsAt(null);
      setSleepTimerRemaining(0);
      return;
    }
    const durationSeconds = minutes * 60;
    setSleepTimerEndsAt(Date.now() + durationSeconds * 1000);
    setSleepTimerRemaining(durationSeconds);
  }, []);

  useEffect(() => {
    if (sleepTimerEndsAt === null) return;
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((sleepTimerEndsAt - Date.now()) / 1000));
      setSleepTimerRemaining(remaining);
      if (remaining === 0) {
        pausePlayback();
        setSleepTimerEndsAt(null);
      }
    };
    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [pausePlayback, sleepTimerEndsAt]);

  useEffect(() => {
    const ayah = detail?.ayahs[activeIndex];
    if (!detail || !ayah) return;
    saveResume(detail.surah.number, ayah.numberInSurah, reciterId);
  }, [activeIndex, detail, reciterId, saveResume]);

  useEffect(() => {
    const ayah = detail?.ayahs[activeIndex];
    const requestedPosition = requestedPositionRef.current;
    if (
      !ayah ||
      requestedPosition === null ||
      loadedSourceUrl !== ayah.audioUrl
    ) {
      return;
    }
    seekPlayback(requestedPosition / 1000);
    if (requestedAutoplayRef.current) playPlayback();
    requestedPositionRef.current = null;
    requestedAutoplayRef.current = false;
  }, [activeIndex, detail, loadedSourceUrl, playPlayback, seekPlayback]);

  useEffect(() => {
    const ayah = detail?.ayahs[activeIndex];
    if (
      !hydrated ||
      !detail ||
      !ayah ||
      player.status === "idle" ||
      player.status === "loading" ||
      player.status === "error" ||
      (player.currentTime <= 0 && !player.isPlaying)
    ) {
      return;
    }

    savePlaybackProgress(
      detail.surah.number,
      ayah.numberInSurah,
      player.currentTime * 1000,
      player.duration * 1000,
      reciterId,
      player.status === "paused",
    );
  }, [
    activeIndex,
    detail,
    hydrated,
    player.currentTime,
    player.duration,
    player.isPlaying,
    player.status,
    reciterId,
    savePlaybackProgress,
  ]);

  const openSurah = useCallback((number: number, ayah?: number, positionMs = 0, autoplay = false) => {
    requestedAyahRef.current = ayah ?? 1;
    requestedPositionRef.current = positionMs;
    requestedAutoplayRef.current = autoplay;

    if (detail?.surah.number === number) {
      const nextIndex = Math.max(
        0,
        detail.ayahs.findIndex((item) => item.numberInSurah === (ayah ?? 1)),
      );
      setActiveView("quran");
      if (
        nextIndex === activeIndex &&
        loadedSourceUrl === detail.ayahs[nextIndex]?.audioUrl
      ) {
        seekPlayback(positionMs / 1000);
        if (autoplay) playPlayback();
        requestedPositionRef.current = null;
        requestedAutoplayRef.current = false;
      } else {
        selectPlaybackAyah(nextIndex, false);
      }
      return;
    }

    setActiveIndex(0);
    setDetail(null);
    setSelectedNumber(number);
    setActiveView("quran");
  }, [activeIndex, detail, loadedSourceUrl, playPlayback, seekPlayback, selectPlaybackAyah]);

  const selectedSummary = useMemo(
    () => surahs.find((surah) => surah.number === selectedNumber) ?? null,
    [selectedNumber, surahs],
  );

  const featuredSurahs = useMemo(
    () => FEATURED_SURAHS.map((number) => surahs.find((surah) => surah.number === number)).filter((item): item is SurahSummary => Boolean(item)),
    [surahs],
  );

  const favoriteSurahItems = useMemo(
    () => library.favoriteSurahs.map((number) => surahs.find((surah) => surah.number === number)).filter((item): item is SurahSummary => Boolean(item)),
    [library.favoriteSurahs, surahs],
  );

  const recentHistory = useMemo(
    () => {
      const bySurah = new Map<number, ListeningHistoryItem[]>();
      for (const item of library.listeningHistory) {
        const items = bySurah.get(item.surah) ?? [];
        items.push(item);
        bySurah.set(item.surah, items);
      }

      return [...bySurah.values()]
        .map((items) => {
          const latest = items.reduce((current, item) =>
            item.updatedAt > current.updatedAt ? item : current,
          );
          const listenedAyahs = new Set(items.map((item) => item.ayah));
          let fromAyah = latest.ayah;
          let toAyah = latest.ayah;
          while (listenedAyahs.has(fromAyah - 1)) fromAyah -= 1;
          while (listenedAyahs.has(toAyah + 1)) toAyah += 1;
          return { latest, fromAyah, toAyah };
        })
        .sort((a, b) => b.latest.updatedAt - a.latest.updatedAt)
        .slice(0, 8);
    },
    [library.listeningHistory],
  );

  const currentAyah = detail?.ayahs[activeIndex] ?? null;
  const currentAyahKey = detail && currentAyah ? `${detail.surah.number}:${currentAyah.numberInSurah}` : "";
  const currentAyahFavorite = currentAyahKey ? library.favoriteAyahs.includes(currentAyahKey) : false;
  const activeStudyLoop = detail && library.studyLoop?.surah === detail.surah.number
    ? library.studyLoop
    : null;

  const showShareMessage = useCallback((message: string) => {
    setShareMessage(message);
    if (shareTimerRef.current !== null) window.clearTimeout(shareTimerRef.current);
    shareTimerRef.current = window.setTimeout(() => setShareMessage(null), 2600);
  }, []);

  const shareAyah = useCallback(async (ayahNumber: number, positionMs = 0) => {
    const ayah = detail?.ayahs.find((item) => item.numberInSurah === ayahNumber);
    if (!detail || !ayah) return;

    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("surah", String(detail.surah.number));
    url.searchParams.set("ayah", String(ayahNumber));
    if (positionMs >= 1000) url.searchParams.set("t", String(Math.round(positionMs / 100) / 10));

    const shareData = {
      title: `${detail.surah.englishName} · Ayah ${ayahNumber}`,
      text: `${ayah.arabicText}\n\n${ayah.frenchText}\n\n${detail.surah.englishName} ${detail.surah.number}:${ayahNumber}\nTraduction française · source indiquée dans RIHLA`,
      url: url.toString(),
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showShareMessage("Ayah partagée");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url.toString());
      } else {
        const input = document.createElement("textarea");
        input.value = url.toString();
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      showShareMessage("Lien de l’ayah copié");
    } catch {
      showShareMessage("Impossible de copier le lien");
    }
  }, [detail, showShareMessage]);

  const showQuranView = () => {
    setPlayerOpen(false);
    setActiveView("quran");
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Aller au contenu principal</a>
      <DesktopNavigation activeView={activeView} onChange={setActiveView} />

      <div className="app-main">
        <header className="topbar">
          <button type="button" className="mobile-brand" onClick={() => setActiveView("home")} aria-label="RIHLA, accueil">
            <span className="brand-mark" aria-hidden="true">ر</span>
            <strong>RIHLA</strong>
          </button>
          <div className="topbar-context">
            <span>{activeView === "quran" ? "Le Coran" : activeView === "library" ? "Bibliothèque" : activeView === "search" ? "Recherche" : activeView === "settings" ? "Réglages" : "Accueil"}</span>
          </div>
          <button
            type="button"
            className="topbar-library"
            onClick={() => setActiveView("settings")}
            aria-label="Ouvrir les réglages"
            aria-current={activeView === "settings" ? "page" : undefined}
          >
            <Settings size={18} aria-hidden="true" />
          </button>
        </header>

        <main id="main-content" tabIndex={-1} className={`page-content view-${activeView}`}>
          {activeView === "home" && (
            <div className="content-stack">
              <section className="quran-hero">
                <div className="hero-art" aria-hidden="true">
                  <span className="hero-orbit one" />
                  <span className="hero-orbit two" />
                  <span className="hero-number">{String(selectedNumber).padStart(3, "0")}</span>
                  <span className="hero-arabic" lang="ar" dir="rtl" translate="no">{detail?.surah.name ?? selectedSummary?.name ?? "القرآن"}</span>
                </div>
                <div className="hero-copy">
                  <p className="eyebrow">{library.lastSurah === selectedNumber ? "Reprendre" : "À écouter"}</p>
                  <h2>{detail?.surah.englishName ?? selectedSummary?.englishName ?? "Le Coran"}</h2>
                  <p>{detail?.reciterName ?? "Choisissez un récitant"}</p>
                  {detail && currentAyah && (
                    <span className="resume-line">
                      Ayah {currentAyah.numberInSurah} · {formatPlaybackTime(library.lastPositionMs)} · {detail.reciterName}
                    </span>
                  )}

                  {detailLoading ? (
                    <button type="button" className="primary-action" disabled><LoaderCircle className="spin" size={19} /> Chargement…</button>
                  ) : detailError ? (
                    <button type="button" className="primary-action" onClick={() => setDetailAttempt((value) => value + 1)}>Réessayer</button>
                  ) : (
                    <div className="hero-actions">
                      <button type="button" className="primary-action" onClick={player.toggle} disabled={!detail}>
                        <Play size={18} fill="currentColor" /> {player.isPlaying ? "Mettre en pause" : "Écouter maintenant"}
                      </button>
                      <button type="button" className="secondary-action" onClick={() => setActiveView("quran")}>
                        <BookOpenText size={18} /> Afficher le Coran
                      </button>
                    </div>
                  )}
                </div>
              </section>

              <section className="featured-section">
                <div className="section-title-row">
                  <div><p className="eyebrow">Accès rapide</p><h2>Sourates essentielles</h2></div>
                  <button type="button" className="text-action" onClick={() => setActiveView("quran")}>Tout parcourir <ChevronRight size={16} /></button>
                </div>
                <div className="featured-grid">
                  {featuredSurahs.map((surah) => (
                    <button type="button" className="featured-surah" key={surah.number} onClick={() => openSurah(surah.number)}>
                      <span>{String(surah.number).padStart(3, "0")}</span>
                      <strong>{surah.englishName}</strong>
                      <small>{surah.frenchName} · {surah.numberOfAyahs} ayat</small>
                      <i lang="ar" dir="rtl" translate="no">{surah.name}</i>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeView === "search" && (
            <div className="content-stack">
              <SurahBrowser
                surahs={surahs}
                selectedNumber={selectedNumber}
                query={query}
                onQueryChange={setQuery}
                onSelect={openSurah}
                favoriteSurahs={library.favoriteSurahs}
                onToggleFavorite={toggleFavoriteSurah}
                loading={catalogLoading}
                error={catalogError}
                onRetry={() => setCatalogAttempt((value) => value + 1)}
                searchPlaceholder="Sourate, mot ou référence 2:255…"
              />
              <QuranSearchResults query={query} onQueryChange={setQuery} onOpen={(surah, ayah) => openSurah(surah, ayah)} />
            </div>
          )}

          {activeView === "quran" && (
            <div className="content-stack quran-view-stack">
              <div className="quran-workspace">
                <div className="quran-catalog-column">
                  <SurahBrowser
                    surahs={surahs}
                    selectedNumber={selectedNumber}
                    query={query}
                    onQueryChange={setQuery}
                    onSelect={openSurah}
                    favoriteSurahs={library.favoriteSurahs}
                    onToggleFavorite={toggleFavoriteSurah}
                    loading={catalogLoading}
                    error={catalogError}
                    onRetry={() => setCatalogAttempt((value) => value + 1)}
                  />
                </div>
                <div className="quran-reading-column">
                  <div className="reading-toolbar">
                    <label>
                      <span>Récitateur</span>
                      <select name="reader-reciter" autoComplete="off" value={reciterId} onChange={(event) => setReciterId(event.target.value)}>
                        {RECITERS.map((reciter) => <option value={reciter.id} key={reciter.id}>{reciter.name}</option>)}
                      </select>
                    </label>
                    <div className="reading-actions">
                      <button type="button" className={`secondary-action ${continuousQuran ? "active" : ""}`} onClick={() => setContinuousQuran((value) => !value)} aria-pressed={continuousQuran}>
                        {continuousQuran ? "Vue continue" : "Vue par verset"}
                      </button>
                      <button
                        type="button"
                        className={`secondary-action ${library.favoriteSurahs.includes(selectedNumber) ? "active" : ""}`}
                        onClick={() => toggleFavoriteSurah(selectedNumber)}
                        aria-pressed={library.favoriteSurahs.includes(selectedNumber)}
                      >
                        <Heart size={17} fill={library.favoriteSurahs.includes(selectedNumber) ? "currentColor" : "none"} />
                        {library.favoriteSurahs.includes(selectedNumber) ? "Sauvegardée" : "Sauvegarder"}
                      </button>
                    </div>
                  </div>

                  {detailLoading && (
                    <div className="large-status" role="status"><LoaderCircle className="spin" size={25} /><strong>Chargement de la sourate…</strong></div>
                  )}
                  {detailError && (
                    <div className="large-status error-card" role="alert">
                      <WifiOff size={25} /><strong>{detailError}</strong>
                      <button type="button" className="secondary-action" onClick={() => setDetailAttempt((value) => value + 1)}>Réessayer</button>
                    </div>
                  )}
                  {detail && (
                    <>
                      <AyahList
                        detail={detail}
                        activeIndex={activeIndex}
                        isPlaying={player.isPlaying}
                        currentTime={player.currentTime}
                        favoriteAyahs={library.favoriteAyahs}
                        showTranslation={library.showTranslation}
                        autoScroll={library.autoScroll}
                        continuousView={continuousQuran}
                        onSelect={(index) => player.selectAyah(index, true)}
                        onToggleFavorite={(ayah) => toggleFavoriteAyah(detail.surah.number, ayah)}
                        onShare={(ayah) => shareAyah(ayah)}
                        onEditNote={(ayah) => setNoteTarget({
                          surah: detail.surah.number,
                          ayah,
                          surahName: detail.surah.englishName,
                        })}
                      />
                      <SourceDisclosure source={detail.source} />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === "library" && (
            <div className="content-stack">
              <section className="library-heading">
                <div><p className="eyebrow">Bibliothèque</p><h1>Vos contenus</h1></div>
                <small>Privés · sur cet appareil</small>
              </section>

              <section className="library-shortcuts" aria-label="Accès à votre bibliothèque">
                <button type="button" onClick={() => setLibrarySection("favorites")}><Heart size={19} /><span><strong>Favoris</strong><small>Sourates et contenus appréciés</small></span><ChevronRight size={17} /></button>
                <button type="button" onClick={() => setLibrarySection("bookmarks")}><Bookmark size={19} /><span><strong>Marque-pages</strong><small>{library.favoriteAyahs.length} passage{library.favoriteAyahs.length > 1 ? "s" : ""}</small></span><ChevronRight size={17} /></button>
                <button type="button" onClick={() => setLibrarySection("notes")}><StickyNote size={19} /><span><strong>Notes</strong><small>{library.ayahNotes.length} note{library.ayahNotes.length > 1 ? "s" : ""}</small></span><ChevronRight size={17} /></button>
                <button type="button" onClick={() => setLibrarySection("history")}><History size={19} /><span><strong>Historique</strong><small>Reprendre vos dernières écoutes</small></span><ChevronRight size={17} /></button>
                <button type="button" onClick={() => setLibrarySection("playlists")}><ListMusic size={19} /><span><strong>Playlists</strong><small>{library.playlists.length} collection{library.playlists.length > 1 ? "s" : ""}</small></span><ChevronRight size={17} /></button>
              </section>

              {librarySection !== "all" && <button type="button" className="text-action library-back" onClick={() => setLibrarySection("all")}>← Toute la bibliothèque</button>}
              {(librarySection === "all" || librarySection === "playlists") && <section className="library-section">
                <div className="section-title-row">
                  <div><p className="eyebrow">Collections personnelles</p><h2>Playlists</h2></div>
                  <button type="button" className="text-action" onClick={() => {
                    const title = window.prompt("Nom de la playlist");
                    if (title) { createPlaylist(title); showShareMessage("Playlist créée"); }
                  }}><Plus size={16} /> Créer</button>
                </div>
                {library.playlists.length ? <div className="library-grid">
                  {library.playlists.map((playlist) => <button type="button" key={playlist.id}>
                    <ListMusic size={18} /><div><strong>{playlist.title}</strong><small>{playlist.ayahKeys.length} passage{playlist.ayahKeys.length > 1 ? "s" : ""}</small></div><ChevronRight size={18} />
                  </button>)}
                </div> : <div className="empty-library compact"><ListMusic size={22} /><strong>Aucune playlist</strong><p>Créez une collection personnelle pour organiser vos écoutes.</p></div>}
              </section>}

              {(librarySection === "all" || librarySection === "history") && <section className="library-section">
                <div className="section-title-row"><div><p className="eyebrow">Reprendre</p><h2>Historique d’écoute</h2></div></div>
                {recentHistory.length ? (
                  <div className="history-list">
                    {recentHistory.map(({ latest, fromAyah, toAyah }) => {
                      const surah = surahs.find((candidate) => candidate.number === latest.surah);
                      const progress = latest.durationMs > 0
                        ? Math.min(100, (latest.positionMs / latest.durationMs) * 100)
                        : 0;
                      const rangeLabel = fromAyah === toAyah
                        ? `Ayah ${toAyah}`
                        : `Ayat ${fromAyah} à ${toAyah}`;
                      return (
                        <button
                          type="button"
                          className="history-item"
                          key={latest.surah}
                          onClick={() => openSurah(latest.surah, latest.ayah, latest.positionMs, true)}
                        >
                          <span className="history-reference">{String(latest.surah).padStart(3, "0")}</span>
                          <span className="history-copy">
                            <strong>{surah?.englishName ?? `Sourate ${latest.surah}`}</strong>
                            <small>{formatHistoryDate(latest.updatedAt)} · {rangeLabel} · reprise à {formatPlaybackTime(latest.positionMs)}</small>
                            <progress max="100" value={progress} aria-label={`Progression de ${Math.round(progress)} %`} />
                          </span>
                          <ChevronRight size={18} />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-library compact"><History size={22} /><strong>Aucune écoute récente</strong><p>Lancez une ayah pour la retrouver ici avec sa progression.</p></div>
                )}
              </section>}

              {(librarySection === "all" || librarySection === "favorites") && <section className="library-section">
                <div className="section-title-row"><div><p className="eyebrow">Favoris</p><h2>Sourates sauvegardées</h2></div></div>
                {favoriteSurahItems.length ? (
                  <div className="library-grid">
                    {favoriteSurahItems.map((surah) => (
                      <button type="button" key={surah.number} onClick={() => openSurah(surah.number)}>
                        <span>{String(surah.number).padStart(3, "0")}</span>
                        <div><strong>{surah.englishName}</strong><small>{surah.frenchName}</small></div>
                        <ChevronRight size={18} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty-library"><Heart size={22} /><strong>Aucune sourate favorite</strong><p>Utilisez le cœur dans le catalogue pour construire votre bibliothèque.</p><button type="button" className="secondary-action" onClick={() => setActiveView("search")}>Parcourir les sourates</button></div>
                )}
              </section>}

              {(librarySection === "all" || librarySection === "bookmarks") && <section className="library-section">
                <div className="section-title-row"><div><p className="eyebrow">Passages</p><h2>Ayat sauvegardées</h2></div></div>
                {library.favoriteAyahs.length ? (
                  <div className="saved-ayah-grid">
                    {library.favoriteAyahs.map((key) => {
                      const [surahNumber, ayahNumber] = key.split(":").map(Number);
                      const surah = surahs.find((item) => item.number === surahNumber);
                      return (
                        <button type="button" key={key} onClick={() => openSurah(surahNumber, ayahNumber)}>
                          <span>{key}</span><strong>{surah?.englishName ?? `Sourate ${surahNumber}`}</strong><small>Ouvrir et écouter l’ayah</small>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-library compact"><Bookmark size={22} /><strong>Aucun marque-page</strong><p>Enregistrez un passage précis depuis le lecteur du Coran.</p></div>
                )}
              </section>}

              {(librarySection === "all" || librarySection === "notes") && <section className="library-section">
                <div className="section-title-row">
                  <div><p className="eyebrow">Réflexions</p><h2>Notes personnelles</h2></div>
                  <span className="section-count">{library.ayahNotes.length}</span>
                </div>
                {library.ayahNotes.length ? (
                  <div className="notes-list">
                    {library.ayahNotes.map((note) => {
                      const surah = surahs.find((item) => item.number === note.surah);
                      return (
                        <button
                          type="button"
                          className="note-item"
                          key={`${note.surah}:${note.ayah}`}
                          onClick={() => openSurah(note.surah, note.ayah)}
                        >
                          <span className="note-item-icon"><StickyNote size={18} /></span>
                          <span className="note-item-copy">
                            <strong>{surah?.englishName ?? `Sourate ${note.surah}`} · {note.surah}:{note.ayah}</strong>
                            <small>{note.text}</small>
                            <em>Modifiée {formatHistoryDate(note.updatedAt).toLocaleLowerCase("fr-FR")}</em>
                          </span>
                          <ChevronRight size={18} />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-library compact">
                    <StickyNote size={22} />
                    <strong>Aucune note personnelle</strong>
                    <p>Ajoutez une réflexion depuis l’icône note d’une ayah.</p>
                  </div>
                )}
              </section>}
            </div>
          )}
          {activeView === "settings" && (
            <div className="content-stack">
              <section className="page-intro compact">
                <p className="eyebrow">Préférences</p>
                <h1>Réglages</h1>
                <p>Adaptez l’apparence et la lecture sans encombrer votre bibliothèque.</p>
              </section>

              <PreferencesPanel
                theme={library.theme}
                appearance={library.appearance}
                readingSize={library.readingSize}
                translationSize={library.translationSize}
                autoScroll={library.autoScroll}
                onThemeChange={(theme) => {
                  setTheme(theme);
                  showShareMessage("Couleur d’accent appliquée");
                }}
                onAppearanceChange={(appearance) => {
                  setAppearance(appearance);
                  showShareMessage("Apparence appliquée");
                }}
                onReadingSizeChange={(size) => {
                  setReadingSize(size);
                  showShareMessage("Taille du Coran appliquée");
                }}
                onTranslationSizeChange={(size) => {
                  setTranslationSize(size);
                  showShareMessage("Taille de traduction appliquée");
                }}
                onAutoScrollChange={(enabled) => {
                  setAutoScroll(enabled);
                  showShareMessage(enabled ? "Suivi automatique activé" : "Suivi automatique désactivé");
                }}
              />
              <section className="data-settings" aria-labelledby="data-settings-title">
                <div className="section-title-row"><div><p className="eyebrow">Données</p><h2 id="data-settings-title">Vos données locales</h2></div></div>
                <p>Vos notes, favoris, playlists et historique sont privés par défaut. Un futur compte servira uniquement à les synchroniser si vous le choisissez.</p>
                <button type="button" role="switch" aria-checked={library.historyEnabled} className="setting-toggle history-toggle" onClick={() => {
                  setHistoryEnabled(!library.historyEnabled);
                  showShareMessage(library.historyEnabled ? "Historique suspendu" : "Historique activé");
                }}>
                  <span className="setting-copy"><strong>Enregistrer l’historique</strong><small>{library.historyEnabled ? "Les prochaines écoutes seront ajoutées" : "Les nouvelles écoutes ne seront pas ajoutées"}</small></span>
                  <span className="switch-track" aria-hidden="true"><i /></span>
                </button>
                <div className="data-settings-actions">
                  <button type="button" className="secondary-action" onClick={() => {
                    const blob = new Blob([exportData()], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement("a");
                    anchor.href = url;
                    anchor.download = "rihla-donnees.json";
                    anchor.click();
                    URL.revokeObjectURL(url);
                    showShareMessage("Export préparé");
                  }}>Exporter mes données</button>
                  <button type="button" className="secondary-action" onClick={() => {
                    if (window.confirm("Effacer tout l’historique d’écoute sur cet appareil ?")) {
                      clearHistory();
                      showShareMessage("Historique effacé");
                    }
                  }}>Effacer l’historique</button>
                  <button type="button" className="danger-action" onClick={() => {
                    if (window.confirm("Supprimer favoris, notes, historique et préférences de lecture de cet appareil ?")) {
                      clearPersonalData();
                      showShareMessage("Données personnelles supprimées");
                    }
                  }}>Supprimer mes données</button>
                </div>
              </section>
            </div>
          )}

        </main>
      </div>

      <MiniPlayer
        detail={detail}
        activeIndex={activeIndex}
        status={player.status}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        onOpen={() => setPlayerOpen(true)}
        onToggle={player.toggle}
        onPrevious={player.previous}
        onNext={player.next}
        canPrevious={player.canPrevious}
        canNext={player.canNext}
      />

      {playerOpen && detail && (
        <FullPlayer
          detail={detail}
          activeIndex={activeIndex}
          status={player.status}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          error={player.error}
          reciterId={reciterId}
          isFavorite={currentAyahFavorite}
          canPrevious={player.canPrevious}
          canNext={player.canNext}
          playbackRate={library.playbackRate}
          repeatMode={library.repeatMode}
          repeatIteration={player.repeatIteration}
          studyLoop={activeStudyLoop}
          studyLoopIteration={player.studyLoopIteration}
          sleepTimerRemaining={sleepTimerRemaining}
          onClose={() => setPlayerOpen(false)}
          onToggle={player.toggle}
          onSeek={player.seek}
          onPrevious={player.previous}
          onNext={player.next}
          onRetry={player.retry}
          onReciterChange={setReciterId}
          onToggleFavorite={() => currentAyah && toggleFavoriteAyah(detail.surah.number, currentAyah.numberInSurah)}
          onShowText={showQuranView}
          onPlaybackRateChange={setPlaybackRate}
          onRepeatModeChange={setRepeatMode}
          onApplyStudyLoop={(value) => {
            const startIndex = detail.ayahs.findIndex(
              (ayah) => ayah.numberInSurah === value.startAyah,
            );
            if (startIndex < 0) return;
            setRepeatMode("off");
            setStudyLoop(value);
            player.selectAyah(startIndex, true);
            showShareMessage(`Boucle ${value.startAyah}–${value.endAyah} lancée`);
          }}
          onStopStudyLoop={() => {
            setStudyLoop(null);
            showShareMessage("Boucle d’étude arrêtée");
          }}
          onSetSleepTimer={setSleepTimer}
          onShare={() => currentAyah && shareAyah(currentAyah.numberInSurah, player.currentTime * 1000)}
        />
      )}

      {shareMessage && <div className="action-toast" role="status" aria-live="polite">{shareMessage}</div>}

      {noteTarget && (
        <AyahNoteDialog
          key={`${noteTarget.surah}:${noteTarget.ayah}`}
          surahName={noteTarget.surahName}
          surahNumber={noteTarget.surah}
          ayahNumber={noteTarget.ayah}
          initialValue={library.ayahNotes.find(
            (note) => note.surah === noteTarget.surah && note.ayah === noteTarget.ayah,
          )?.text ?? ""}
          onClose={() => setNoteTarget(null)}
          onSave={(value) => {
            saveAyahNote(noteTarget.surah, noteTarget.ayah, value);
            setNoteTarget(null);
            showShareMessage(value.trim() ? "Note enregistrée" : "Note supprimée");
          }}
        />
      )}

      <MobileNavigation activeView={activeView} onChange={setActiveView} />
    </div>
  );
}
