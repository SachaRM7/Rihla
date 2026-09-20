"use client";
import {
  BookOpenText,
  Bookmark,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Heart,
  Home,
  History,
  Library,
  ListMusic,
  Plus,
  Pencil,
  Trash2,
  LoaderCircle,
  Play,
  Search,
  Settings,
  Wifi,
  Bell,
  StickyNote,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AyahList } from "@/components/ayah-list";
import { AyahNoteDialog } from "@/components/ayah-note-dialog";
import { CreatorProfile } from "@/components/creator-profile";
import { PlaybackQueue } from "@/components/playback-queue";
import { OfflineDownloadControl } from "@/components/offline-download-control";
import { SpokenPlayer } from "@/components/spoken-player";
import { SeriesProfile } from "@/components/series-profile";
import { FullPlayer } from "@/components/full-player";
import { MiniPlayer } from "@/components/mini-player";
import { MobileNavigation, type AppView } from "@/components/mobile-navigation";
import { PreferencesPanel } from "@/components/preferences-panel";
import { QuranSearchResults } from "@/components/quran-search-results";
import { moveQueueEntry, removeQueueEntry } from "@/lib/playback-queue";
import type { QueueEntry } from "@/lib/playback";
import { preferredMediaVariant } from "@/lib/media-variants";
import { canDownloadOffline } from "@/lib/offline";
import { publicContents } from "@/lib/catalog";
import { SPOKEN_CATALOG } from "@/lib/spoken-catalog";
import { TafsirDialog } from "@/components/tafsir-dialog";
import { SourceDisclosure } from "@/components/source-disclosure";
import { SurahBrowser } from "@/components/surah-browser";
import { useLocalLibrary, type ListeningHistoryItem } from "@/hooks/use-local-library";
import { useQuranPlayer } from "@/hooks/use-quran-player";
import { parseQuranJump } from "@/lib/quran/jump";
import { DEFAULT_RECITER_ID, RECITERS } from "@/lib/quran/constants";
import type { ContentItem, MediaAsset } from "@/lib/domain";
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

function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

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
    saveReadingProgress,
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
    toggleAyahInPlaylist,
    deletePlaylist,
    movePlaylistAyah,
    renamePlaylist,
    removeAyahFromPlaylist,
    exportData,
    importData,
    clearHistory,
    setHistoryEnabled,
    removeHistoryItem,
    removeSpokenProgress,
    setWifiOnlyDownloads,
    setMemorizationMode,
    setContinuousQuran,
    setMemorizationRevealDelay,
    setReadingGoal,
    setReadingGoalMode,
    setSpokenPlaybackRate,
    setCrossFamilyAutoAdvance,
    setPlaybackQueue,
    saveSpokenProgress,
    removeSpokenProgress,
    clearSpokenProgress,
    toggleFollow,
    setFollowNotification,
    hideRecommendation,
    restoreRecommendations,
    setReminderPreferences,
    setAudioQuality,
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
  const [librarySection, setLibrarySection] = useState<"all" | "favorites" | "bookmarks" | "notes" | "history" | "playlists">("all");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [quranJump, setQuranJump] = useState("");
  const [tafsirTarget, setTafsirTarget] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [downloadStates, setDownloadStates] = useState<Record<string, "QUEUED"|"DOWNLOADING"|"AVAILABLE"|"ERROR">>({});
  const [spokenNowPlaying, setSpokenNowPlaying] = useState<{ content: ContentItem; asset: MediaAsset } | null>(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [noteQuery, setNoteQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "quran" | "spoken">("all");
  const [playerOpen, setPlayerOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [sleepTimerEndsAt, setSleepTimerEndsAt] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(0);
  const [sleepAtEnd, setSleepAtEnd] = useState<"ayah" | "surah" | null>(null);
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
  }, [])

  useEffect(() => {
    setNotificationPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);

  useEffect(() => {
    if (!library.remindersEnabled || typeof Notification === "undefined") return;
    if (Notification.permission === "default") void Notification.requestPermission().then(setNotificationPermission);
    const tick = () => {
      if (Notification.permission !== "granted") return;
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const key = `rihla.reminder.${now.toISOString().slice(0, 10)}`;
      if (hhmm === library.reminderTime && localStorage.getItem(key) !== "sent") {
        new Notification("RIHLA", { body: "Votre lecture vous attend quand vous le souhaitez." });
        localStorage.setItem(key, "sent");
      }
    };
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [library.reminderTime, library.remindersEnabled]);;

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
    stopAtEnd: sleepAtEnd,
    onStopAtEndConsumed: () => setSleepAtEnd(null),
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
    if (!detail || !ayah || activeView !== "quran") return;
    saveReadingProgress(detail.surah.number, ayah.numberInSurah);
  }, [activeIndex, activeView, detail, saveReadingProgress]);

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

  const todayReadingKey = localDayKey();
  const todayReadCount = library.readingDays[todayReadingKey]?.length ?? 0;
  const khatmaDailyTarget = Math.max(1, Math.ceil(6236 / library.khatmaTargetDays));
  const effectiveDailyTarget = library.readingGoalMode === "KHATMA" ? khatmaDailyTarget : library.readingGoalAyahsPerDay;
  const effectiveReadingProgress = library.readingGoalEnabled ? Math.min(100, Math.round((todayReadCount / effectiveDailyTarget) * 100)) : 0;
  const recentReadingDays = Object.entries(library.readingDays).sort(([a],[b]) => b.localeCompare(a)).slice(0,7);

  const spokenContents = publicContents(SPOKEN_CATALOG);
  const hasSpokenContents = spokenContents.length > 0;
  const selectedCreator = SPOKEN_CATALOG.creators.find((item) => item.id === selectedCreatorId) ?? null;
  const selectedSeries = SPOKEN_CATALOG.series.find((item) => item.id === selectedSeriesId) ?? null;
  const queueSpokenContent = (content: ContentItem) => {
    const asset = content.mediaAssetIds.map((id)=>SPOKEN_CATALOG.media.find((item)=>item.id===id)).find((item): item is MediaAsset=>Boolean(item&&item.kind==="AUDIO"));
    if(!asset) return;
    const entry: QueueEntry = { id: crypto.randomUUID(), addedAt: new Date().toISOString(), item: { id: content.id, family: "SPOKEN", title: content.title, subtitle: content.description, mediaUrl: asset.url, durationMs: asset.durationMs, contentId: content.id } };
    setPlaybackQueue([...library.playbackQueue, entry]);
    setShareMessage("Ajouté à la file d’attente");
  };

  const playSpokenContent = (content: ContentItem) => {
    const asset = content.mediaAssetIds.map((id) => SPOKEN_CATALOG.media.find((item) => item.id === id)).find((item): item is MediaAsset => Boolean(item && item.kind === "AUDIO"));
    if (!asset) { setShareMessage("Aucun audio autorisé disponible"); return; }
    const preferred = preferredMediaVariant(asset, SPOKEN_CATALOG.variants ?? [], library.audioQuality);
    setSpokenNowPlaying({ content, asset: preferred ? { ...asset, url: preferred.url } : asset });
  };

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
      text: `${ayah.arabicText}\n\n${ayah.frenchText}\n\n${detail.surah.englishName} ${detail.surah.number}:${ayahNumber}\n${detail.source.translationAuthor ? `Traduction : ${detail.source.translationAuthor}` : "Traduction française"} · ${detail.source.name}`,
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
      <a className="skip-link" href="#main-content">Aller au contenu</a>
      {!isOnline && <div className="network-banner" role="status">Hors connexion · les contenus déjà chargés restent accessibles</div>}
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

              {library.readingGoalEnabled && <section className="reading-goal-card">
                <div><p className="eyebrow">Votre rythme</p><strong>{todayReadCount} / {effectiveDailyTarget} ayat aujourd’hui</strong><small>{library.readingGoalMode === "KHATMA" ? `Rythme indicatif pour une lecture complète en ${library.khatmaTargetDays} jours` : "Objectif indicatif"} · reprenez simplement où vous en êtes.</small><span className="reading-goal-progress"><i style={{ width: `${effectiveReadingProgress}%` }} /></span>
                  {recentReadingDays.length > 0 && <span className="reading-week" aria-label="Lecture des derniers jours">{recentReadingDays.map(([day, entries]) => <i key={day} title={`${day} · ${entries.length} ayat`} className={entries.length >= effectiveDailyTarget ? "complete" : entries.length > 0 ? "partial" : ""} />)}</span>}</div>
                <button type="button" className="secondary-action" onClick={() => openSurah(library.quranReadingSurah, library.quranReadingAyah)}>Continuer</button>
              </section>}

              <section className="progress-choices">
                <button type="button" onClick={() => openSurah(library.lastSurah, library.lastAyah, library.lastPositionMs, false)}>
                  <Play size={17} /><span><strong>Continuer l’écoute</strong><small>Sourate {library.lastSurah} · Ayah {library.lastAyah}</small></span><ChevronRight size={16} />
                </button>
                <button type="button" onClick={() => openSurah(library.quranReadingSurah, library.quranReadingAyah)}>
                  <BookOpenText size={17} /><span><strong>Continuer la lecture</strong><small>Sourate {library.quranReadingSurah} · Ayah {library.quranReadingAyah}</small></span><ChevronRight size={16} />
                </button>
              </section>

              <section className="time-discovery">
                <div className="section-title-row"><div><p className="eyebrow">Selon votre temps</p><h2>Choisir une écoute</h2></div></div>
                <div className="time-discovery-grid">
                  <button type="button" onClick={() => openSurah(112)}><span>Quelques minutes</span><strong>Al-Ikhlas</strong><small>Une récitation courte</small></button>
                  <button type="button" onClick={() => openSurah(36)}><span>Un trajet</span><strong>Ya-Sin</strong><small>Prendre un peu plus de temps</small></button>
                  <button type="button" onClick={() => openSurah(2)}><span>Écoute approfondie</span><strong>Al-Baqara</strong><small>Pour une écoute longue</small></button>
                </div>
              </section>

              <section className="featured-section">
                <div className="section-title-row">
                  <div><p className="eyebrow">Accès rapide</p><h2>Sourates essentielles</h2></div>
                  <button type="button" className="text-action" onClick={() => setActiveView("quran")}>Tout parcourir <ChevronRight size={16} /></button>
                </div>
                <div className="featured-grid">
                  {featuredSurahs.filter((surah) => !library.hiddenRecommendations.includes(`surah:${surah.number}`)).map((surah) => (
                    <div className="featured-surah-wrap" key={surah.number}>
                      <button type="button" className="featured-surah" onClick={() => openSurah(surah.number)}>
                        <span>{String(surah.number).padStart(3, "0")}</span>
                        <strong>{surah.englishName}</strong>
                        <small>{surah.frenchName} · {surah.numberOfAyahs} ayat</small>
                        <i lang="ar" dir="rtl" translate="no">{surah.name}</i>
                      </button>
                      <button type="button" className="hide-recommendation" aria-label={`Masquer ${surah.englishName}`} onClick={() => hideRecommendation(`surah:${surah.number}`)}>×</button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeView === "search" && (
            <div className="content-stack">
              <div className="search-filters" role="group" aria-label="Type de contenu">
                <button type="button" className={searchType === "all" ? "active" : ""} onClick={() => { setSearchType("all"); setSelectedCreatorId(null); setSelectedSeriesId(null); }}>Tout</button>
                <button type="button" className={searchType === "quran" ? "active" : ""} onClick={() => { setSearchType("quran"); setSelectedCreatorId(null); setSelectedSeriesId(null); }}>Coran</button>
                <button type="button" className={searchType === "spoken" ? "active" : ""} onClick={() => { setSearchType("spoken"); setSelectedCreatorId(null); setSelectedSeriesId(null); }}>Cours & rappels</button>
              </div>
              {searchType !== "spoken" && <SurahBrowser
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
              />}
              {searchType !== "spoken" && <QuranSearchResults query={query} onQueryChange={setQuery} onOpen={(surah, ayah) => openSurah(surah, ayah)} />}
              {searchType === "spoken" && !hasSpokenContents && <div className="empty-library"><Search size={24} /><strong>Catalogue parlé en préparation</strong><p>Les cours, rappels et conférences apparaîtront ici uniquement lorsqu’une sélection autorisée sera disponible.</p></div>}
              {searchType === "spoken" && hasSpokenContents && !selectedCreator && !selectedSeries && <div className="spoken-catalog-list">{spokenContents.map((item) => {
                const asset = item.mediaAssetIds.map((id)=>SPOKEN_CATALOG.media.find((media)=>media.id===id)).find((media): media is MediaAsset=>Boolean(media&&media.kind==="AUDIO"));
                const allowed = Boolean(asset && canDownloadOffline(asset,SPOKEN_CATALOG.rights));
                return <div className="spoken-catalog-row" key={item.id}><button type="button" onClick={() => playSpokenContent(item)}><div><strong>{item.title}</strong><small>{item.type.replaceAll("_"," ").toLocaleLowerCase("fr")}</small></div><ChevronRight size={18}/></button><button type="button" className="queue-add-action" onClick={()=>queueSpokenContent(item)} aria-label={`Ajouter ${item.title} à la file d’attente`}><Plus size={16}/>File</button>{asset && <OfflineDownloadControl allowed={allowed} status={downloadStates[item.id]} onDownload={()=>{ if(library.wifiOnlyDownloads){ const connection=(navigator as Navigator & {connection?:{type?:string}}).connection; if(connection?.type && connection.type!=="wifi"){setShareMessage("Téléchargement réservé au Wi-Fi");return;} } setDownloadStates((current)=>({...current,[item.id]:"QUEUED"})); setShareMessage("Téléchargement prêt · stockage hors connexion à connecter"); }} />}</div>;
              })}</div>}
              {searchType === "spoken" && (selectedCreator || selectedSeries) && <button type="button" className="text-action spoken-profile-back" onClick={() => { setSelectedCreatorId(null); setSelectedSeriesId(null); }}>← Tous les contenus parlés</button>}
              {searchType === "spoken" && selectedCreator && <CreatorProfile creator={selectedCreator} contents={spokenContents.filter((item)=>item.creatorIds.includes(selectedCreator.id))} followed={library.follows.some((item)=>item.id===selectedCreator.id&&item.type==="CREATOR")} notifications={library.follows.find((item)=>item.id===selectedCreator.id&&item.type==="CREATOR")?.notify ?? false} onToggleFollow={()=>toggleFollow(selectedCreator.id,"CREATOR")} onToggleNotifications={(enabled)=>setFollowNotification(selectedCreator.id,"CREATOR",enabled)} onOpenContent={(content)=>{ if(content.mediaAssetIds.length) playSpokenContent(content); else if(content.seriesId) { setSelectedCreatorId(null); setSelectedSeriesId(content.seriesId); } }} />}
              {searchType === "spoken" && selectedSeries && <SeriesProfile series={selectedSeries} contents={spokenContents} followed={library.follows.some((item)=>item.id===selectedSeries.id&&item.type==="SERIES")} notifications={library.follows.find((item)=>item.id===selectedSeries.id&&item.type==="SERIES")?.notify ?? false} onToggleFollow={()=>toggleFollow(selectedSeries.id,"SERIES")} onToggleNotifications={(enabled)=>setFollowNotification(selectedSeries.id,"SERIES",enabled)} onOpen={(content)=>playSpokenContent(content)} />}
            </div>
          )}

          {activeView === "quran" && (
            <div className="content-stack quran-view-stack">
              <form className="quran-jump" onSubmit={(event) => {
                event.preventDefault();
                const target = parseQuranJump(quranJump);
                if (!target) { showShareMessage("Exemples : 2:255, Juz 30 ou Hizb 60"); return; }
                if (target.surah < 1 || target.surah > 114 || target.ayah < 1) { showShareMessage("Référence invalide"); return; }
                openSurah(target.surah, target.ayah);
              }}>
                <label><span>Accès direct</span><input value={quranJump} onChange={(event) => setQuranJump(event.target.value)} placeholder="2:255 · Juz 30 · Hizb 60" inputMode="text" /></label>
                <button type="submit" className="secondary-action">Ouvrir</button>
              </form>
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
                      <select name="reader-reciter" autoComplete="off" value={reciterId} onChange={(event) => {
                        const ayahNumber = detail?.ayahs[activeIndex]?.numberInSurah ?? library.lastAyah;
                        setReciterId(event.target.value);
                        setInitialAyah(ayahNumber);
                        setInitialPositionMs(0);
                        setInitialAutoplay(player.isPlaying);
                      }}>
                        {RECITERS.map((reciter) => <option value={reciter.id} key={reciter.id}>{reciter.name}</option>)}
                      </select>
                    </label>
                    <div className="reading-actions">
                      <button type="button" className={`secondary-action ${library.memorizationMode ? "active" : ""}`} onClick={() => setMemorizationMode(!library.memorizationMode)} aria-pressed={library.memorizationMode}>
                        {library.memorizationMode ? "Mémorisation active" : "Mémoriser"}
                      </button>
                      {library.memorizationMode && <label className="memorization-delay"><span>Révéler après</span><select value={library.memorizationRevealDelay} onChange={(event) => setMemorizationRevealDelay(Number(event.target.value))}><option value={0}>Manuellement</option><option value={3}>3 s</option><option value={5}>5 s</option><option value={10}>10 s</option></select></label>}
                      <button type="button" className={`secondary-action ${library.continuousQuran ? "active" : ""}`} onClick={() => setContinuousQuran(!library.continuousQuran)} aria-pressed={library.continuousQuran}>
                        {library.continuousQuran ? "Vue continue" : "Vue par verset"}
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
                showTranslation={library.showTranslation}
                        continuousView={library.continuousQuran}
                        memorizationMode={library.memorizationMode}
                        memorizationRevealDelay={library.memorizationRevealDelay}
                        onSelect={(index) => { const ayah = detail.ayahs[index]; if (ayah) saveReadingProgress(detail.surah.number, ayah.numberInSurah); player.selectAyah(index, true); }}
                        onToggleFavorite={(ayah) => toggleFavoriteAyah(detail.surah.number, ayah)}
                        onShare={(ayah) => shareAyah(ayah)}
                        onOpenTafsir={(ayah) => setTafsirTarget(ayah)}
                        onAddToPlaylist={(ayah) => {
                          if (!library.playlists.length) { const title = window.prompt("Créez d’abord une playlist"); if (title) createPlaylist(title); return; }
                          const choice = window.prompt(`Ajouter à quelle playlist ?\n${library.playlists.map((playlist, index) => `${index + 1}. ${playlist.title}`).join("\n")}`);
                          const playlist = library.playlists[Number(choice) - 1];
                          if (playlist) { toggleAyahInPlaylist(playlist.id, detail.surah.number, ayah); showShareMessage(`Ajouté à ${playlist.title}`); }
                        }}
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
                <button type="button" onClick={() => { setSelectedPlaylistId(null); setLibrarySection("playlists"); }}><ListMusic size={19} /><span><strong>Playlists</strong><small>{library.playlists.length} collection{library.playlists.length > 1 ? "s" : ""}</small></span><ChevronRight size={17} /></button>
              </section>

              {librarySection !== "all" && <button type="button" className="text-action library-back" onClick={() => { setSelectedPlaylistId(null); setLibrarySection("all"); }}>← Toute la bibliothèque</button>}
              {(librarySection === "all" || librarySection === "playlists") && <section className="library-section">
                <div className="section-title-row">
                  <div><p className="eyebrow">Collections personnelles</p><h2>Playlists</h2></div>
                  <button type="button" className="text-action" onClick={() => {
                    const title = window.prompt("Nom de la playlist");
                    if (title) { createPlaylist(title); showShareMessage("Playlist créée"); }
                  }}><Plus size={16} /> Créer</button>
                </div>
                {selectedPlaylistId ? (() => {
                  const playlist = library.playlists.find((item) => item.id === selectedPlaylistId);
                  if (!playlist) return null;
                  return <div className="playlist-detail">
                    <button type="button" className="text-action" onClick={() => setSelectedPlaylistId(null)}>← Playlists</button>
                    <div className="section-title-row"><div><p className="eyebrow">Playlist</p><h2>{playlist.title}</h2></div><div className="playlist-title-actions"><span className="section-count">{playlist.ayahKeys.length}</span><button type="button" className="icon-button" aria-label="Renommer la playlist" onClick={() => { const title = window.prompt("Nouveau nom", playlist.title); if (title) renamePlaylist(playlist.id, title); }}><Pencil size={16} /></button></div></div>
                    {playlist.ayahKeys.length ? <div className="saved-ayah-grid">
                      {playlist.ayahKeys.map((key, index) => {
                        const [surahNumber, ayahNumber] = key.split(":").map(Number);
                        const surah = surahs.find((item) => item.number === surahNumber);
                        return <div className="playlist-passage" key={key}>
                          <button type="button" className="playlist-passage-main" onClick={() => openSurah(surahNumber, ayahNumber)}>
                            <span>{key}</span><strong>{surah?.englishName ?? `Sourate ${surahNumber}`}</strong><small>Ouvrir le passage</small>
                          </button>
                          <span className="playlist-order">
                            <button type="button" aria-label="Retirer ce passage de la playlist" onClick={() => removeAyahFromPlaylist(playlist.id, key)}><Trash2 size={15} /></button>
                            <button type="button" aria-label="Monter ce passage" disabled={index === 0} onClick={() => movePlaylistAyah(playlist.id, index, index - 1)}><ChevronUp size={16} /></button>
                            <button type="button" aria-label="Descendre ce passage" disabled={index === playlist.ayahKeys.length - 1} onClick={() => movePlaylistAyah(playlist.id, index, index + 1)}><ChevronDown size={16} /></button>
                          </span>
                        </div>;
                      })}
                    </div> : <div className="empty-library compact"><ListMusic size={22} /><strong>Playlist vide</strong><p>Ajoutez des passages depuis le menu d’un verset.</p></div>}
                  </div>;
                })() : library.playlists.length ? <div className="library-grid">
                  {library.playlists.map((playlist) => <div className="playlist-row" key={playlist.id}>
                    <button type="button" onClick={() => setSelectedPlaylistId(playlist.id)}><ListMusic size={18} /><div><strong>{playlist.title}</strong><small>{playlist.ayahKeys.length} passage{playlist.ayahKeys.length > 1 ? "s" : ""}</small></div><ChevronRight size={18} /></button>
                    <button type="button" className="playlist-delete" aria-label={`Supprimer ${playlist.title}`} onClick={() => { if (window.confirm(`Supprimer la playlist « ${playlist.title} » ?`)) deletePlaylist(playlist.id); }}>×</button>
                  </div>)}
                </div> : <div className="empty-library compact"><ListMusic size={22} /><strong>Aucune playlist</strong><p>Créez une collection personnelle pour organiser vos écoutes.</p></div>}
              </section>}

              {librarySection === "playlists" && selectedPlaylistId && (() => {
                const playlist = library.playlists.find((item) => item.id === selectedPlaylistId);
                if (!playlist) return null;
                return <section className="library-section playlist-detail">
                  <div className="section-title-row">
                    <div><p className="eyebrow">Playlist</p><h2>{playlist.title}</h2></div>
                    <button type="button" className="text-action" onClick={() => { const title = window.prompt("Nouveau nom", playlist.title); if (title) renamePlaylist(playlist.id, title); }}><Pencil size={15}/> Renommer</button>
                  </div>
                  {playlist.ayahKeys.length ? <div className="playlist-items">
                    {playlist.ayahKeys.map((key, index) => {
                      const [surahNumber, ayahNumber] = key.split(":").map(Number);
                      const surah = surahs.find((item) => item.number === surahNumber);
                      return <div className="playlist-item" key={key}>
                        <button type="button" className="playlist-open" onClick={() => openSurah(surahNumber, ayahNumber)}><span>{key}</span><strong>{surah?.englishName ?? `Sourate ${surahNumber}`}</strong></button>
                        <button type="button" disabled={index === 0} aria-label="Monter" onClick={() => movePlaylistAyah(playlist.id,index,index-1)}><ArrowUp size={15}/></button>
                        <button type="button" disabled={index === playlist.ayahKeys.length-1} aria-label="Descendre" onClick={() => movePlaylistAyah(playlist.id,index,index+1)}><ArrowDown size={15}/></button>
                        <button type="button" aria-label="Retirer" onClick={() => toggleAyahInPlaylist(playlist.id,surahNumber,ayahNumber)}>×</button>
                      </div>;
                    })}
                  </div> : <div className="empty-library compact"><ListMusic size={22}/><strong>Playlist vide</strong><p>Ajoutez des passages depuis le menu d’un verset.</p></div>}
                </section>;
              })()}

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
                        <div className="history-row" key={latest.surah}>
                        <button
                          type="button"
                          className="history-item"
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
                        <button type="button" className="history-remove" aria-label={`Retirer ${surah?.englishName ?? "cette écoute"} de l’historique`} onClick={() => removeHistoryItem(latest.surah)}><Trash2 size={15} /></button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-library compact"><History size={22} /><strong>Aucune écoute récente</strong><p>Lancez une ayah pour la retrouver ici avec sa progression.</p></div>
                )}
              </section>}

              {(librarySection === "all" || librarySection === "history") && library.spokenProgress.length > 0 && <section className="library-section">
                <div className="section-title-row"><div><p className="eyebrow">Contenus parlés</p><h2>À reprendre</h2></div><button type="button" className="text-action" onClick={clearSpokenProgress}>Effacer</button></div>
                <div className="history-list">{[...library.spokenProgress].sort((a,b)=>b.updatedAt-a.updatedAt).map((progress)=>{
                  const content=SPOKEN_CATALOG.contents.find((item)=>item.id===progress.contentId);
                  if(!content)return null;
                  const percent=progress.durationMs>0?Math.min(100,(progress.positionMs/progress.durationMs)*100):0;
                  return <div className="history-row" key={progress.contentId}><button type="button" className="history-item" onClick={()=>playSpokenContent(content)}><span className="history-reference"><Play size={16}/></span><span className="history-copy"><strong>{content.title}</strong><small>{formatHistoryDate(progress.updatedAt)} · reprise à {formatPlaybackTime(progress.positionMs)}</small><progress max="100" value={percent} aria-label={`Progression de ${Math.round(percent)} %`}/></span><ChevronRight size={18}/></button><button type="button" className="history-remove" aria-label={`Retirer ${content.title} de l’historique`} onClick={()=>removeSpokenProgress(progress.contentId)}><Trash2 size={15}/></button></div>;
                })}</div>
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
                  <div className="empty-library"><Heart size={22} /><strong>Aucune sourate favorite</strong><p>Utilisez le cœur d’une sourate dans le catalogue pour la retrouver ici.</p><button type="button" className="secondary-action" onClick={() => setActiveView("search")}>Parcourir les sourates</button></div>
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
                {library.ayahNotes.length > 0 && <label className="notes-search"><Search size={16}/><input value={noteQuery} onChange={(event) => setNoteQuery(event.target.value)} placeholder="Rechercher dans vos notes" /></label>}
                {library.ayahNotes.length ? (
                  <div className="notes-list">
                    {library.ayahNotes.filter((note) => { const q = noteQuery.trim().toLocaleLowerCase("fr"); return !q || note.text.toLocaleLowerCase("fr").includes(q) || `${note.surah}:${note.ayah}`.includes(q); }).map((note) => {
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
                onShowTranslationChange={(enabled) => {
                  setShowTranslation(enabled);
                  showShareMessage(enabled ? "Traduction affichée" : "Traduction masquée");
                }}
                onAutoScrollChange={(enabled) => {
                  setAutoScroll(enabled);
                  showShareMessage(enabled ? "Suivi automatique activé" : "Suivi automatique désactivé");
                }}
              />
              <section className="data-settings" aria-labelledby="reading-goal-title">
                <div className="section-title-row"><div><p className="eyebrow">Facultatif</p><h2 id="reading-goal-title">Objectif de lecture</h2></div></div>
                <button type="button" role="switch" aria-checked={library.readingGoalEnabled} className="setting-toggle" onClick={() => setReadingGoal(!library.readingGoalEnabled)}>
                  <span className="setting-icon"><BookOpenText size={18} /></span><span className="setting-copy"><strong>Suivre un rythme personnel</strong><small>Aucun classement, série ou pénalité si vous manquez un jour</small></span><span className="switch-track" aria-hidden="true"><i /></span>
                </button>
                {library.readingGoalEnabled && <div className="segmented-control reading-goal-mode" role="radiogroup" aria-label="Type d’objectif"><button type="button" role="radio" aria-checked={library.readingGoalMode==="AYAT"} className={library.readingGoalMode==="AYAT"?"selected":""} onClick={()=>setReadingGoalMode("AYAT")}>Ayat / jour</button><button type="button" role="radio" aria-checked={library.readingGoalMode==="KHATMA"} className={library.readingGoalMode==="KHATMA"?"selected":""} onClick={()=>setReadingGoalMode("KHATMA")}>Lecture complète</button></div>}
                {library.readingGoalEnabled && library.readingGoalMode==="KHATMA" && <label className="quality-setting"><span>Durée souhaitée</span><select value={library.khatmaTargetDays} onChange={(event)=>setReadingGoalMode("KHATMA",Number(event.target.value))}><option value={30}>30 jours</option><option value={60}>60 jours</option><option value={90}>90 jours</option><option value={180}>6 mois</option><option value={365}>1 an</option></select></label>}
                {library.readingGoalEnabled && library.readingGoalMode==="AYAT" && <label className="quality-setting"><span>Ayat par jour</span><input type="number" min={1} max={100} value={library.readingGoalAyahsPerDay} onChange={(event) => setReadingGoal(true, Math.min(100, Math.max(1, Number(event.target.value))))} /></label>}
              </section>

              <section className="data-settings" aria-labelledby="reminder-settings-title">
                <div className="section-title-row"><div><p className="eyebrow">Facultatif</p><h2 id="reminder-settings-title">Rappel de lecture</h2></div></div>
                <button type="button" role="switch" aria-checked={library.remindersEnabled} className="setting-toggle" onClick={() => setReminderPreferences(!library.remindersEnabled)}>
                  <span className="setting-icon"><Bell size={18} /></span><span className="setting-copy"><strong>Me rappeler de reprendre</strong><small>Sans série, classement ni culpabilisation</small></span><span className="switch-track" aria-hidden="true"><i /></span>
                </button>
                {library.remindersEnabled && notificationPermission === "denied" && <p className="permission-warning">Les notifications sont bloquées dans le navigateur. Autorisez-les pour recevoir ce rappel.</p>}
                {library.remindersEnabled && notificationPermission === "unsupported" && <p className="permission-warning">Les notifications ne sont pas disponibles dans cet environnement.</p>}
                {library.remindersEnabled && <label className="quality-setting"><span>Horaire souhaité</span><input type="time" value={library.reminderTime} onChange={(event) => setReminderPreferences(true, event.target.value)} /></label>}
              </section>

              {library.hiddenRecommendations.length > 0 && <section className="data-settings" aria-labelledby="recommendation-settings-title">
                <div className="section-title-row"><div><p className="eyebrow">Accueil</p><h2 id="recommendation-settings-title">Recommandations masquées</h2></div><span className="section-count">{library.hiddenRecommendations.length}</span></div>
                <p>Vous pouvez repartir de zéro sans toucher à vos favoris ou à votre historique.</p>
                <button type="button" className="secondary-action" onClick={() => { restoreRecommendations(); showShareMessage("Recommandations restaurées"); }}>Tout réafficher</button>
              </section>}

              <section className="data-settings" aria-labelledby="autoplay-settings-title">
                <div className="section-title-row"><div><p className="eyebrow">Lecture automatique</p><h2 id="autoplay-settings-title">Enchaînement des contenus</h2></div></div>
                <button type="button" role="switch" aria-checked={library.allowCrossFamilyAutoAdvance} className="setting-toggle" onClick={() => setCrossFamilyAutoAdvance(!library.allowCrossFamilyAutoAdvance)}>
                  <span className="setting-copy"><strong>Autoriser Coran ↔ contenus parlés</strong><small>{library.allowCrossFamilyAutoAdvance ? "L’enchaînement entre familles de contenus est autorisé" : "Une récitation ne lancera pas automatiquement un podcast ou une conférence"}</small></span>
                  <span className="switch-track" aria-hidden="true"><i /></span>
                </button>
              </section>

              <section className="data-settings" aria-labelledby="spoken-player-title">
                <div className="section-title-row"><div><p className="eyebrow">Contenus parlés</p><h2 id="spoken-player-title">Vitesse d’écoute</h2></div></div>
                <p>Ce réglage est indépendant de la vitesse utilisée pour les récitations du Coran.</p>
                <label className="quality-setting"><span>Podcasts, cours et conférences</span><select value={library.spokenPlaybackRate} onChange={(event) => setSpokenPlaybackRate(Number(event.target.value) as 0.75 | 1 | 1.25 | 1.5)}><option value={0.75}>0,75×</option><option value={1}>1×</option><option value={1.25}>1,25×</option><option value={1.5}>1,5×</option></select></label>
              </section>

              <section className="data-settings" aria-labelledby="network-settings-title">
                <div className="section-title-row"><div><p className="eyebrow">Réseau</p><h2 id="network-settings-title">Économie de données</h2></div></div>
                <button type="button" role="switch" aria-checked={library.wifiOnlyDownloads} className="setting-toggle" onClick={() => setWifiOnlyDownloads(!library.wifiOnlyDownloads)}>
                  <span className="setting-icon"><Wifi size={18} /></span><span className="setting-copy"><strong>Téléchargements en Wi-Fi uniquement</strong><small>Préférence prête pour les contenus autorisés hors connexion</small></span><span className="switch-track" aria-hidden="true"><i /></span>
                </button>
                <label className="quality-setting"><span>Qualité audio préférée</span><select value={library.audioQuality} onChange={(event) => setAudioQuality(event.target.value as "data-saver" | "standard" | "high")}><option value="data-saver">Économie</option><option value="standard">Standard</option><option value="high">Haute</option></select></label>
              </section>

              <section className="data-settings" aria-labelledby="data-settings-title">
                <div className="section-title-row"><div><p className="eyebrow">Données</p><h2 id="data-settings-title">Vos données locales</h2></div></div>
                <p>Vos notes, favoris, playlists et historique sont privés par défaut. Un futur compte servira uniquement à les synchroniser si vous le choisissez.</p>
                <button type="button" role="switch" aria-checked={library.historyEnabled} className="setting-toggle history-toggle" onClick={() => {
                  setHistoryEnabled(!library.historyEnabled);
                  showShareMessage(library.historyEnabled ? "Historique suspendu" : "Historique activé");
                }}>
                  <span className="setting-copy"><strong>Enregistrer l’historique</strong><small>{library.historyEnabled ? "Les prochaines écoutes Coran et contenus parlés seront ajoutées" : "Aucune nouvelle écoute ne sera ajoutée"}</small></span>
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
                  <label className="secondary-action import-data-action">
                    Restaurer une sauvegarde
                    <input type="file" accept="application/json,.json" onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const ok = importData(await file.text());
                      showShareMessage(ok ? "Sauvegarde restaurée" : "Sauvegarde invalide");
                      event.target.value = "";
                    }} />
                  </label>
                  <button type="button" className="secondary-action" onClick={() => {
                    if (window.confirm("Effacer tout l’historique d’écoute, Coran et contenus parlés, sur cet appareil ?")) {
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
          sleepAtEnd={sleepAtEnd}
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
          onSetSleepAtEnd={(mode) => {
            setSleepAtEnd(mode);
            if (mode) setSleepTimer(null);
          }}
          onShare={() => currentAyah && shareAyah(currentAyah.numberInSurah, player.currentTime * 1000)}
        />
      )}

      {activeView === "library" && library.playbackQueue.length > 0 && <div className="queue-drawer"><PlaybackQueue queue={library.playbackQueue} onPlay={(entry)=>{const content=SPOKEN_CATALOG.contents.find((item)=>item.id===entry.item.contentId);if(content)playSpokenContent(content);}} onRemove={(id)=>setPlaybackQueue(removeQueueEntry(library.playbackQueue,id))} onMove={(id,toIndex)=>setPlaybackQueue(moveQueueEntry(library.playbackQueue,id,toIndex))} onClear={()=>setPlaybackQueue([])} /></div>}
      
            {spokenNowPlaying && <SpokenPlayer
        content={spokenNowPlaying.content}
        asset={spokenNowPlaying.asset}
        variants={SPOKEN_CATALOG.variants ?? []}
        playbackRate={library.spokenPlaybackRate}
        transcript={SPOKEN_CATALOG.transcripts?.find((item) => item.contentId === spokenNowPlaying.content.id)}
        transcriptSegments={SPOKEN_CATALOG.transcriptSegments ?? []}
        chapters={(SPOKEN_CATALOG.chapters ?? []).filter((item) => item.contentId === spokenNowPlaying.content.id)}
        initialPositionMs={library.spokenProgress.find((item) => item.contentId === spokenNowPlaying.content.id)?.positionMs ?? 0}
        onProgress={(positionMs, durationMs) => saveSpokenProgress(spokenNowPlaying.content.id, positionMs, durationMs)}
        onReportIssue={() => setShareMessage("Signalement enregistré localement · envoi serveur à connecter")}
        onClose={() => setSpokenNowPlaying(null)}
      />}
      
            {shareMessage && <div className="action-toast" role="status" aria-live="polite">{shareMessage}</div>}

      {tafsirTarget && detail && <TafsirDialog surahNumber={detail.surah.number} ayahNumber={tafsirTarget} source={detail.source} onClose={() => setTafsirTarget(null)} />}

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
