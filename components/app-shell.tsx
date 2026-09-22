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
  WifiOff,
  Download,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AyahList } from "@/components/ayah-list";
import { AyahNoteDialog } from "@/components/ayah-note-dialog";
import { CreatorProfile } from "@/components/creator-profile";
import { PlaybackQueue } from "@/components/playback-queue";
import { UniversalSpokenPlayer } from "@/components/universal-spoken-player";
import { SpokenSearchResults } from "@/components/spoken-search-results";
import { SeriesProfile } from "@/components/series-profile";
import { FullPlayer } from "@/components/full-player";
import { MiniPlayer } from "@/components/mini-player";
import { MobileNavigation, type AppView } from "@/components/mobile-navigation";
import { PreferencesPanel } from "@/components/preferences-panel";
import { AccountPanel } from "@/components/account-panel";
import { QuranSearchResults } from "@/components/quran-search-results";
import { moveQueueEntry, removeQueueEntry } from "@/lib/playback-queue";
import type { QueueEntry } from "@/lib/playback";
import { useDownloads } from "@/hooks/use-downloads";
import { DownloadLibrary } from "@/components/download-library";
import { DownloadOptionsDialog } from "@/components/download-options-dialog";
import type { DownloadQuality, DownloadRecord, StorageEstimate } from "@/lib/download-types";
import { preferredMediaVariant } from "@/lib/media-variants";
import { publicContents } from "@/lib/catalog";
import { SPOKEN_CATALOG } from "@/lib/spoken-catalog";
import { TafsirDialog } from "@/components/tafsir-dialog";
import { SourceDisclosure } from "@/components/source-disclosure";
import { SurahBrowser } from "@/components/surah-browser";
import { useLocalLibrary, type ListeningHistoryItem } from "@/hooks/use-local-library";
import { useQuranPlayer } from "@/hooks/use-quran-player";
import { parseQuranJump } from "@/lib/quran/jump";
import { resolveHizb, resolveJuz } from "@/lib/quran/navigation";
import { DEFAULT_RECITER_ID, RECITERS } from "@/lib/quran/constants";
import type { ContentItem, MediaAsset } from "@/lib/domain";
import { parsePublicRoute, publicRoutePath, type PublicRoute } from "@/lib/public-routes";
import type {
  ApiErrorResponse,
  SurahCatalogResponse,
  SurahDetail,
  SurahDetailResponse,
  SurahSummary,
} from "@/lib/quran/types";

const FEATURED_SURAHS = [1, 18, 36, 55, 67, 112];
const DOWNLOAD_CATALOG = { ...SPOKEN_CATALOG, contentIds: publicContents(SPOKEN_CATALOG).map((content) => content.id) };
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

type AppShellProps = { initialRoute?: PublicRoute };

export function AppShell({ initialRoute }: AppShellProps = {}) {
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
    createPlaylistWithAyah,
    createPlaylistWithSpoken,
    toggleAyahInPlaylist,
    toggleSpokenInPlaylist,
    setPlaylistMixedContent,
    removePlaylistFormat,
    duplicatePlaylist,
    deletePlaylist,
    movePlaylistItem,
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

  const initialView: AppView = initialRoute?.kind === "quran" ? "quran" : initialRoute && initialRoute.kind !== "home" ? "search" : "home";
  const [activeView, setActiveView] = useState<AppView>(initialView);
  const [surahs, setSurahs] = useState<SurahSummary[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogAttempt, setCatalogAttempt] = useState(0);

  const [selectedNumber, setSelectedNumber] = useState(initialRoute?.kind === "quran" ? initialRoute.surah : 1);
  const [reciterId, setReciterId] = useState(DEFAULT_RECITER_ID);
  const [detail, setDetail] = useState<SurahDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailAttempt, setDetailAttempt] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [librarySection, setLibrarySection] = useState<"all" | "favorites" | "bookmarks" | "notes" | "history" | "playlists" | "downloads">("all");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [quranJump, setQuranJump] = useState("");
  const [tafsirTarget, setTafsirTarget] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const downloads = useDownloads({ catalog: DOWNLOAD_CATALOG, wifiOnly: library.wifiOnlyDownloads });
  const [pendingDownload, setPendingDownload] = useState<{ content: ContentItem; asset: MediaAsset; quality?: DownloadQuality } | null>(null);
  const [downloadEstimate, setDownloadEstimate] = useState<StorageEstimate | null>(null);
  const downloadRecords = useMemo(() => Object.fromEntries(downloads.records.map((record) => [record.contentId, record])), [downloads.records]);
  const [activePlaylistRun, setActivePlaylistRun] = useState<{playlistId:string;index:number}|null>(null);
  const [queueCurrentId, setQueueCurrentId] = useState<string | null>(null);
  const [spokenNowPlaying, setSpokenNowPlaying] = useState<{ content: ContentItem; asset: MediaAsset } | null>(null);
  const [spokenAutoplay, setSpokenAutoplay] = useState(false);
  const [spokenPlayerOpen, setSpokenPlayerOpen] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(() => initialRoute?.kind === "creator" ? SPOKEN_CATALOG.creators.find((item) => item.slug === initialRoute.slug)?.id ?? null : null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(() => initialRoute?.kind === "series" ? SPOKEN_CATALOG.series.find((item) => item.slug === initialRoute.slug)?.id ?? null : null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(() => initialRoute?.kind === "collection" ? (SPOKEN_CATALOG.collections ?? []).find((item) => item.slug === initialRoute.slug)?.id ?? null : null);
  const [pendingContentSlug, setPendingContentSlug] = useState<string | null>(() => initialRoute?.kind === "content" ? initialRoute.slug : null);
  const [noteQuery, setNoteQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "quran" | "spoken">(initialRoute && initialRoute.kind !== "home" && initialRoute.kind !== "quran" ? "spoken" : "all");
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

  const applyRoute = useCallback((route: PublicRoute, resolveContent = true) => {
    if (route.kind === "quran") {
      setActiveView("quran");
      setSelectedNumber(route.surah);
      requestedAyahRef.current = route.ayah ?? 1;
      setSelectedCreatorId(null);
      setSelectedSeriesId(null);
      setSelectedCollectionId(null);
      return;
    }
    if (route.kind === "creator") {
      setActiveView("search");
      setSearchType("spoken");
      setSelectedCreatorId(SPOKEN_CATALOG.creators.find((item) => item.slug === route.slug)?.id ?? null);
      setSelectedSeriesId(null);
      setSelectedCollectionId(null);
      return;
    }
    if (route.kind === "series") {
      setActiveView("search");
      setSearchType("spoken");
      setSelectedSeriesId(SPOKEN_CATALOG.series.find((item) => item.slug === route.slug)?.id ?? null);
      setSelectedCreatorId(null);
      setSelectedCollectionId(null);
      return;
    }
    if (route.kind === "collection") {
      setActiveView("search");
      setSearchType("spoken");
      setSelectedCollectionId((SPOKEN_CATALOG.collections ?? []).find((item) => item.slug === route.slug)?.id ?? null);
      setSelectedCreatorId(null);
      setSelectedSeriesId(null);
      return;
    }
    if (route.kind === "content") {
      setActiveView("search");
      setSearchType("spoken");
      setSelectedCreatorId(null);
      setSelectedSeriesId(null);
      setSelectedCollectionId(null);
      setPendingContentSlug(resolveContent ? route.slug : null);
      return;
    }
    setActiveView("home");
    setSelectedCreatorId(null);
    setSelectedSeriesId(null);
    setSelectedCollectionId(null);
  }, []);

  const pushRoute = useCallback((route: PublicRoute, replace = false, resolveContent = true) => {
    applyRoute(route, resolveContent);
    const path = publicRoutePath(route);
    if (`${window.location.pathname}${window.location.search}` !== path) {
      window.history[replace ? "replaceState" : "pushState"]({}, "", path);
    }
  }, [applyRoute]);

  const navigateToView = useCallback((view: AppView) => {
    if (view === "quran") pushRoute({ kind: "quran", surah: selectedNumber });
    else if (view === "home") pushRoute({ kind: "home" });
    else {
      setActiveView(view);
      setSelectedCreatorId(null);
      setSelectedSeriesId(null);
      setSelectedCollectionId(null);
      window.history.pushState({}, "", `/?view=${view}`);
    }
  }, [pushRoute, selectedNumber]);

  const applyLocation = useCallback(() => {
    const route = parsePublicRoute(window.location.pathname, window.location.search);
    applyRoute(route);
    const params = new URLSearchParams(window.location.search);
    if (route.kind === "home") {
      setQuery(params.get("q") ?? "");
      const type = params.get("type");
      if (type === "quran" || type === "spoken" || type === "all") setSearchType(type);
      const view = params.get("view");
      if (view === "search" || view === "quran" || view === "library" || view === "settings") setActiveView(view);
    }
  }, [applyRoute]);

  useEffect(() => {
    const updateNetworkState = () => setIsOnline(navigator.onLine);
    updateNetworkState();
    window.addEventListener("online", updateNetworkState);
    window.addEventListener("offline", updateNetworkState);
    return () => {
      window.removeEventListener("online", updateNetworkState);
      window.removeEventListener("offline", updateNetworkState);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || initializedRef.current) return;
    initializedRef.current = true;
    applyLocation();
    const params = new URLSearchParams(window.location.search);
    const parsedRoute = parsePublicRoute(window.location.pathname, window.location.search);
    const routeSurah = parsedRoute.kind === "quran" ? parsedRoute.surah : null;
    const routeAyah = parsedRoute.kind === "quran" ? parsedRoute.ayah ?? null : null;
    const linkedSurah = Number(params.get("surah"));
    const linkedAyah = Number(params.get("ayah"));
    const linkedTimeValue = params.get("t");
    const linkedTime = linkedTimeValue === null ? 0 : Number(linkedTimeValue);
    const isAuthRecovery = params.get("auth") === "recovery";
    const hasValidQueryLink =
      Number.isInteger(linkedSurah) && linkedSurah >= 1 && linkedSurah <= 114 &&
      Number.isInteger(linkedAyah) && linkedAyah >= 1 && linkedAyah <= 286 &&
      Number.isFinite(linkedTime) && linkedTime >= 0 && linkedTime <= 86_400;
    const hasValidLink = routeSurah !== null || hasValidQueryLink;

    setSelectedNumber(routeSurah ?? (hasValidQueryLink ? linkedSurah : library.lastSurah));
    setReciterId(isValidReciter(library.reciterId) ? library.reciterId : DEFAULT_RECITER_ID);
    requestedAyahRef.current = routeAyah ?? (hasValidQueryLink ? linkedAyah : null);
    requestedPositionRef.current = routeSurah !== null ? library.lastPositionMs : hasValidLink ? linkedTime * 1000 : library.lastPositionMs;
    if (hasValidQueryLink && routeSurah === null) window.requestAnimationFrame(() => setActiveView("quran"));
    if (isAuthRecovery) window.requestAnimationFrame(() => setActiveView("settings"));
  }, [applyLocation, hydrated, library.lastPositionMs, library.lastSurah, library.reciterId]);

  useEffect(() => {
    const onPopState = () => applyLocation();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [applyLocation]);

  useEffect(() => () => {
    if (shareTimerRef.current !== null) window.clearTimeout(shareTimerRef.current);
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setNotificationPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    });
    return () => window.cancelAnimationFrame(frame);
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
    stopAfterCurrentAyah: Boolean((queueCurrentId && library.playbackQueue.find((entry) => entry.id === queueCurrentId)?.item.family === "QURAN") || (activePlaylistRun && library.playlists.find((item)=>item.id===activePlaylistRun.playlistId)?.itemOrder[activePlaylistRun.index]?.startsWith("quran:"))),
    onAyahEnded: () => { if (queueCurrentId) advanceQueue(true); else if (activePlaylistRun) advancePlaylist(); },
    onSurahEnded: () => { if (queueCurrentId) advanceQueue(true); else if (activePlaylistRun) advancePlaylist(); },
    mediaSessionEnabled: !spokenNowPlaying,
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

  const openSurah = useCallback((number: number, ayah?: number, positionMs = 0, autoplay = false, preserveQueue = false, preservePlaylist = false) => {
    setSpokenAutoplay(false);
    setSpokenPlayerOpen(false);
    setSpokenNowPlaying(null);
    if (!preserveQueue) setQueueCurrentId(null);
    if (!preservePlaylist) setActivePlaylistRun(null);
    requestedAyahRef.current = ayah ?? 1;
    requestedPositionRef.current = positionMs;
    requestedAutoplayRef.current = autoplay;

    if (detail?.surah.number === number) {
      const nextIndex = Math.max(
        0,
        detail.ayahs.findIndex((item) => item.numberInSurah === (ayah ?? 1)),
      );
      pushRoute({ kind: "quran", surah: number, ayah });
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
    pushRoute({ kind: "quran", surah: number, ayah });
  }, [activeIndex, detail, loadedSourceUrl, playPlayback, pushRoute, seekPlayback, selectPlaybackAyah]);

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

  const spokenContents = useMemo(() => publicContents(SPOKEN_CATALOG), []);
  const selectedCollection = (SPOKEN_CATALOG.collections ?? []).find((item) => item.id === selectedCollectionId) ?? null;
  const selectedCollectionContentIds = selectedCollection?.contentIds;


  const hasSpokenContents = spokenContents.length > 0;
  const selectedCreator = SPOKEN_CATALOG.creators.find((item) => item.id === selectedCreatorId) ?? null;
  const selectedSeries = SPOKEN_CATALOG.series.find((item) => item.id === selectedSeriesId) ?? null;
  const addSpokenToPlaylist = (content: ContentItem) => {
    if (!library.playlists.length) { const title=window.prompt("Créez votre première playlist"); if(title){createPlaylistWithSpoken(title,content.id);showShareMessage("Playlist créée avec ce contenu");} return; }
    const choice=window.prompt(`Ajouter à quelle playlist ?\n${library.playlists.map((playlist,index)=>`${index+1}. ${playlist.title}`).join("\n")}`);
    const playlist=library.playlists[Number(choice)-1]; if(!playlist)return;
    if(!playlist.allowMixedContent && playlist.ayahKeys.length>0){showShareMessage("Cette playlist contient du Coran · activez d’abord le mélange");return;}
    const already=playlist.spokenContentIds.includes(content.id); toggleSpokenInPlaylist(playlist.id,content.id); showShareMessage(already?`Retiré de ${playlist.title}`:`Ajouté à ${playlist.title}`);
  };

  const queueSpokenContent = (content: ContentItem) => {
    const asset = content.mediaAssetIds.map((id)=>SPOKEN_CATALOG.media.find((item)=>item.id===id)).find((item): item is MediaAsset=>Boolean(item));
    if(!asset) return;
    const entry: QueueEntry = { id: crypto.randomUUID(), addedAt: new Date().toISOString(), item: { id: content.id, family: "SPOKEN", title: content.title, subtitle: content.description, artworkUrl: content.artworkUrl, mediaUrl: asset.url, durationMs: asset.durationMs, contentId: content.id } };
    setPlaybackQueue([...library.playbackQueue, entry]);
    setShareMessage("Ajouté à la file d’attente");
  };

  const insertQueueEntry = (entry: QueueEntry, mode: "next" | "end") => {
    const nextQueue = [...library.playbackQueue];
    if (mode === "next" && queueCurrentId) {
      const currentIndex = nextQueue.findIndex((item) => item.id === queueCurrentId);
      if (currentIndex >= 0) nextQueue.splice(currentIndex + 1, 0, entry);
      else nextQueue.push(entry);
    } else if (mode === "next") nextQueue.unshift(entry);
    else nextQueue.push(entry);
    setPlaybackQueue(nextQueue);
  };

  const queueSpokenNext = (content: ContentItem) => {
    const asset = content.mediaAssetIds.map((id)=>SPOKEN_CATALOG.media.find((item)=>item.id===id)).find((item): item is MediaAsset=>Boolean(item));
    if(!asset) return;
    insertQueueEntry({ id: crypto.randomUUID(), addedAt: new Date().toISOString(), item: { id: content.id, family: "SPOKEN", title: content.title, subtitle: content.description, artworkUrl: content.artworkUrl, mediaUrl: asset.url, durationMs: asset.durationMs, contentId: content.id } }, "next");
    setShareMessage("Lecture ajoutée ensuite");
  };

  const queueQuranAyah = (ayahNumber: number, mode: "next" | "end" = "end") => {
    const ayah = detail?.ayahs.find((item) => item.numberInSurah === ayahNumber);
    if (!detail || !ayah) return;
    insertQueueEntry({ id: crypto.randomUUID(), addedAt: new Date().toISOString(), item: { id: `quran:${detail.surah.number}:${ayahNumber}`, family: "QURAN", title: `${detail.surah.englishName} · Ayah ${ayahNumber}`, subtitle: detail.reciterName, mediaUrl: ayah.audioUrl, recitationId: reciterId, quranReference: { surah: detail.surah.number, ayah: ayahNumber } } }, mode);
    setShareMessage(mode === "next" ? "Ayah programmée ensuite" : "Ayah ajoutée à la file");
  };

  const downloadSpokenContent = (content: ContentItem, asset: MediaAsset) => {
    if (!isOnline) { showShareMessage("Reconnectez-vous pour télécharger ce média."); return; }
    setPendingDownload({ content, asset });
  };

  const refreshDownloads = async () => {
    await downloads.refresh();
    try { setDownloadEstimate(await downloads.storageEstimate()); }
    catch { setDownloadEstimate(null); }
  };

  const retryDownload = (record: DownloadRecord) => {
    const content = spokenContents.find((item) => item.id === record.contentId);
    const asset = SPOKEN_CATALOG.media.find((item) => item.id === record.mediaAssetId);
    if (!content || !asset) { showShareMessage("Ce contenu n’est plus disponible au téléchargement."); return; }
    setPendingDownload({ content, asset, quality: record.quality });
  };

  const playPlaylistItem = (playlistId:string,index:number) => {
    const playlist=library.playlists.find((item)=>item.id===playlistId); const key=playlist?.itemOrder[index]; if(!playlist||!key)return;
    pausePlayback(); setSpokenPlayerOpen(false); setSpokenNowPlaying(null); setActivePlaylistRun({playlistId,index});
    if(key.startsWith("quran:")){const [surah,ayah]=key.slice(6).split(":").map(Number);openSurah(surah,ayah,0,true,false,true);return;}
    const content=SPOKEN_CATALOG.contents.find((item)=>item.id===key.slice(7)); if(content)playSpokenContent(content, true, true, "playlist");
  };
  const advancePlaylist = () => {
    if(!activePlaylistRun)return; const playlist=library.playlists.find((item)=>item.id===activePlaylistRun.playlistId); if(!playlist)return;
    const nextIndex=activePlaylistRun.index+1; if(nextIndex>=playlist.itemOrder.length){setActivePlaylistRun(null);setShareMessage("Playlist terminée");return;}
    const current=playlist.itemOrder[activePlaylistRun.index]; const next=playlist.itemOrder[nextIndex];
    const crosses=current.startsWith("quran:")!==next.startsWith("quran:");
    if(crosses && !playlist.allowMixedContent){setActivePlaylistRun(null);pausePlayback();setSpokenNowPlaying(null);setShareMessage("Lecture arrêtée avant le changement de format");return;}
    playPlaylistItem(playlist.id,nextIndex);
  };

  useEffect(() => {
    if (!activePlaylistRun) return;
    const playlist = library.playlists.find((item) => item.id === activePlaylistRun.playlistId);
    if (!playlist || activePlaylistRun.index >= playlist.itemOrder.length) {
      const frame = window.requestAnimationFrame(() => {
        setActivePlaylistRun(null);
        pausePlayback();
        setSpokenNowPlaying(null);
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, [activePlaylistRun, library.playlists, pausePlayback]);

  const playSpokenContent = useCallback((content: ContentItem, updateRoute = true, autoplay = false, context: "manual" | "queue" | "playlist" = "manual") => {
    if (!spokenContents.some((item) => item.id === content.id)) {
      setShareMessage("Ce contenu n’est plus disponible.");
      return;
    }
    const asset = content.mediaAssetIds.map((id) => SPOKEN_CATALOG.media.find((item) => item.id === id)).find((item): item is MediaAsset => Boolean(item));
    if (!asset) { setShareMessage("Aucun audio autorisé disponible"); return; }
    const preferred = preferredMediaVariant(asset, SPOKEN_CATALOG.variants ?? [], library.audioQuality);
    const downloaded = !isOnline ? downloads.records.find((record) => record.contentId === content.id && record.mediaAssetId === asset.id && record.status === "AVAILABLE") : undefined;
    const cachedVariant = downloaded?.variantId ? SPOKEN_CATALOG.variants?.find((variant) => variant.id === downloaded.variantId && variant.mediaAssetId === asset.id) : undefined;
    pausePlayback();
    setPlayerOpen(false);
    setSpokenPlayerOpen(false);
    if (context === "manual") {
      setQueueCurrentId(null);
      setActivePlaylistRun(null);
    }
    const selectedAsset = downloaded ? { ...asset, url: downloaded.url, mimeType: cachedVariant?.mimeType ?? asset.mimeType, sizeBytes: downloaded.sizeBytes ?? undefined, checksumSha1: downloaded.checksum ?? undefined }
      : preferred ? { ...asset, url: preferred.url, mimeType: preferred.mimeType ?? asset.mimeType, sizeBytes: preferred.sizeBytes, checksumSha1: preferred.checksumSha1 } : asset;
    setSpokenNowPlaying({ content, asset: selectedAsset });
    setSpokenAutoplay(autoplay);
    if (updateRoute) pushRoute({ kind: "content", slug: content.slug }, false, false);
  }, [library.audioQuality, pausePlayback, pushRoute, spokenContents, isOnline, downloads.records]);

  const playQueueEntry = (entry: QueueEntry) => {
    setQueueCurrentId(entry.id);
    setActivePlaylistRun(null);
    pausePlayback();
    if (entry.item.family === "QURAN") {
      const reference = entry.item.quranReference;
      if (!reference?.surah || !reference.ayah) {
        setPlaybackQueue(removeQueueEntry(library.playbackQueue, entry.id));
        setQueueCurrentId(null);
        setShareMessage("Référence Quran indisponible");
        return;
      }
      setSpokenNowPlaying(null);
      setSpokenAutoplay(false);
      setSpokenPlayerOpen(false);
      openSurah(reference.surah, reference.ayah, 0, true, true);
      return;
    }
    const content = SPOKEN_CATALOG.contents.find((item) => item.id === entry.item.contentId || item.id === entry.item.id);
    if (!content) {
      setPlaybackQueue(removeQueueEntry(library.playbackQueue, entry.id));
      setQueueCurrentId(null);
      setShareMessage("Contenu retiré de la file : il n’est plus disponible");
      return;
    }
    playSpokenContent(content, true, true, "queue");
  };

  const advanceQueue = (automatic = false) => {
    const queue = library.playbackQueue;
    const currentIndex = queue.findIndex((entry) => entry.id === queueCurrentId);
    if (currentIndex < 0) return;
    const current = queue[currentIndex];
    const next = queue[currentIndex + 1];
    const remaining = removeQueueEntry(queue, current.id);
    setPlaybackQueue(remaining);
    if (!next) {
      setQueueCurrentId(null);
      setSpokenNowPlaying(null);
      pausePlayback();
      setShareMessage("File terminée");
      return;
    }
    const crossesFamily = current.item.family !== next.item.family;
    if (automatic && crossesFamily && !library.allowCrossFamilyAutoAdvance && !window.confirm("La prochaine écoute change de format (Coran / contenu parlé). Continuer ?")) {
      setQueueCurrentId(null);
      setSpokenNowPlaying(null);
      pausePlayback();
      setShareMessage("Lecture arrêtée avant le changement de format");
      return;
    }
    playQueueEntry(next);
  };

  const previousQueueEntry = () => {
    const currentIndex = library.playbackQueue.findIndex((entry) => entry.id === queueCurrentId);
    if (currentIndex > 0) playQueueEntry(library.playbackQueue[currentIndex - 1]);
    else player.previous();
  };

  const nextQueueEntry = () => {
    if (queueCurrentId) advanceQueue(false);
    else player.next();
  };
  const previousSpokenEntry = () => {
    if (queueCurrentId) previousQueueEntry();
    else if (activePlaylistRun && activePlaylistRun.index > 0) playPlaylistItem(activePlaylistRun.playlistId, activePlaylistRun.index - 1);
  };
  const nextSpokenEntry = () => {
    if (queueCurrentId) advanceQueue(false);
    else if (activePlaylistRun) advancePlaylist();
  };
  const currentQueueIndex = library.playbackQueue.findIndex((entry) => entry.id === queueCurrentId);
  const canPreviousQueue = queueCurrentId ? currentQueueIndex > 0 : player.canPrevious;
  const canNextQueue = queueCurrentId ? currentQueueIndex >= 0 && currentQueueIndex < library.playbackQueue.length - 1 : player.canNext;
  const canPreviousSpoken = queueCurrentId ? currentQueueIndex > 0 : Boolean(activePlaylistRun && activePlaylistRun.index > 0);
  const canNextSpoken = queueCurrentId
    ? currentQueueIndex >= 0 && currentQueueIndex < library.playbackQueue.length - 1
    : Boolean(activePlaylistRun && activePlaylistRun.index < (library.playlists.find((item) => item.id === activePlaylistRun.playlistId)?.itemOrder.length ?? 0) - 1);

  useEffect(() => {
    if (!pendingContentSlug || !spokenContents.length) return;
    const content = spokenContents.find((item) => item.slug === pendingContentSlug);
    const frame = window.requestAnimationFrame(() => {
      setPendingContentSlug(null);
      if (content) playSpokenContent(content, false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pendingContentSlug, playSpokenContent, spokenContents]);

  useEffect(() => {
    if (activeView !== "search" || !initializedRef.current || selectedCreator || selectedSeries || selectedCollection) return;
    if (window.location.pathname.startsWith("/content/")) return;
    const params = new URLSearchParams();
    params.set("view", "search");
    if (query) params.set("q", query);
    if (searchType !== "all") params.set("type", searchType);
    window.history.replaceState({}, "", `/?${params.toString()}`);
  }, [activeView, query, searchType, selectedCollection, selectedCreator, selectedSeries]);

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

  const shareAyah = async (ayahNumber: number, positionMs = 0) => {
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
  };

  const showQuranView = () => {
    setPlayerOpen(false);
    navigateToView("quran");
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Aller au contenu</a>
      {!isOnline && <div className="network-banner" role="status">Hors connexion · les contenus déjà chargés restent accessibles</div>}
      <a className="skip-link" href="#main-content">Aller au contenu principal</a>
      <DesktopNavigation activeView={activeView} onChange={navigateToView} />

      <div className="app-main">
        <header className="topbar">
          <button type="button" className="mobile-brand" onClick={() => navigateToView("home")} aria-label="RIHLA, accueil">
            <span className="brand-mark" aria-hidden="true">ر</span>
            <strong>RIHLA</strong>
          </button>
          <div className="topbar-context">
            <span>{activeView === "quran" ? "Le Coran" : activeView === "library" ? "Bibliothèque" : activeView === "search" ? "Recherche" : activeView === "settings" ? "Réglages" : "Accueil"}</span>
          </div>
          <button
            type="button"
            className="topbar-library"
            onClick={() => navigateToView("settings")}
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
                      <button type="button" className="secondary-action" onClick={() => navigateToView("quran")}>
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
                  <button type="button" className="text-action" onClick={() => navigateToView("quran")}>Tout parcourir <ChevronRight size={16} /></button>
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
            <div className="content-stack search-view-stack">
              <label className="search-control transversal-search">
                <Search size={19} aria-hidden="true" />
                <input
                  autoFocus
                  type="search"
                  name="global-search"
                  autoComplete="off"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Sourate, verset, cours, intervenant…"
                  aria-label="Rechercher dans tous les contenus"
                />
                {query && <button type="button" onClick={() => setQuery("")} aria-label="Effacer la recherche">×</button>}
              </label>

              <div className="search-filters" role="group" aria-label="Type de contenu">
                <button type="button" className={searchType === "all" ? "active" : ""} onClick={() => { setSearchType("all"); setSelectedCreatorId(null); setSelectedSeriesId(null); }}>Tout</button>
                <button type="button" className={searchType === "quran" ? "active" : ""} onClick={() => { setSearchType("quran"); setSelectedCreatorId(null); setSelectedSeriesId(null); }}>Coran</button>
                {hasSpokenContents && <button type="button" className={searchType === "spoken" ? "active" : ""} onClick={() => { setSearchType("spoken"); setSelectedCreatorId(null); setSelectedSeriesId(null); }}>Cours & rappels</button>}
              </div>

              {(searchType === "all" || searchType === "quran") && <div className="search-secondary-filters">
                <label><span>Récitant</span><select value={reciterId} onChange={(event) => setReciterId(event.target.value)}>{RECITERS.map((reciter)=><option value={reciter.id} key={reciter.id}>{reciter.name}</option>)}</select></label>
              </div>}

              {(searchType === "all" || searchType === "quran") && query.trim().length > 0 && <SurahBrowser
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
                showSearch={false}
              />}

              {(searchType === "all" || searchType === "quran") && <QuranSearchResults query={query} onQueryChange={setQuery} onOpen={(surah, ayah) => openSurah(surah, ayah)} />}

              {selectedCollection && <section className="section-title-row route-context"><div><p className="eyebrow">Collection éditoriale</p><h2>{selectedCollection.title}</h2><small>{selectedCollection.description}</small></div></section>}
              {hasSpokenContents && (searchType === "all" || searchType === "spoken") && !selectedCreator && !selectedSeries && <SpokenSearchResults catalog={SPOKEN_CATALOG} contentIds={selectedCollectionContentIds} query={query} onOpen={playSpokenContent} onQueue={queueSpokenContent} onPlayNext={queueSpokenNext} onAddToPlaylist={addSpokenToPlaylist} downloadRecords={downloadRecords} onDownload={downloadSpokenContent} />}

              {searchType === "spoken" && (selectedCreator || selectedSeries || selectedCollection) && <button type="button" className="text-action spoken-profile-back" onClick={() => { setSelectedCreatorId(null); setSelectedSeriesId(null); setSelectedCollectionId(null); navigateToView("search"); }}>← Tous les contenus parlés</button>}
              {searchType === "spoken" && selectedCreator && <CreatorProfile creator={selectedCreator} contents={spokenContents.filter((item)=>item.creatorIds.includes(selectedCreator.id))} followed={library.follows.some((item)=>item.id===selectedCreator.id&&item.type==="CREATOR")} notifications={library.follows.find((item)=>item.id===selectedCreator.id&&item.type==="CREATOR")?.notify ?? false} onToggleFollow={()=>toggleFollow(selectedCreator.id,"CREATOR")} onToggleNotifications={(enabled)=>setFollowNotification(selectedCreator.id,"CREATOR",enabled)} onOpenContent={(content)=>playSpokenContent(content)} />}
              {searchType === "spoken" && selectedSeries && <SeriesProfile series={selectedSeries} contents={spokenContents} followed={library.follows.some((item)=>item.id===selectedSeries.id&&item.type==="SERIES")} notifications={library.follows.find((item)=>item.id===selectedSeries.id&&item.type==="SERIES")?.notify ?? false} onToggleFollow={()=>toggleFollow(selectedSeries.id,"SERIES")} onToggleNotifications={(enabled)=>setFollowNotification(selectedSeries.id,"SERIES",enabled)} onOpen={(content)=>playSpokenContent(content)} />}
            </div>
          )}

          {activeView === "quran" && (
            <div className="content-stack quran-view-stack">
              <form className="quran-jump" onSubmit={(event) => {
                event.preventDefault();
                const target = parseQuranJump(quranJump);
                if (!target) { showShareMessage("Exemples : 2:255, Juz 30 ou Hizb 60"); return; }
                if (target.kind === "JUZ") {
                  const division = resolveJuz(target.juz);
                  if (!division) { showShareMessage("Référence invalide"); return; }
                  openSurah(division.surah, division.ayah);
                  return;
                }
                if (target.kind === "HIZB") {
                  const division = resolveHizb(target.hizb);
                  if (!division) { showShareMessage("Référence invalide"); return; }
                  openSurah(division.surah, division.ayah);
                  return;
                }
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
                        requestedAyahRef.current = ayahNumber;
                        requestedPositionRef.current = 0;
                        requestedAutoplayRef.current = player.isPlaying;
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
                        continuousView={library.continuousQuran}
                        memorizationMode={library.memorizationMode}
                        memorizationRevealDelay={library.memorizationRevealDelay}
                        onSelect={(index) => { const ayah = detail.ayahs[index]; if (ayah) { setQueueCurrentId(null); setActivePlaylistRun(null); setSpokenPlayerOpen(false); setSpokenNowPlaying(null); setSpokenAutoplay(false); saveReadingProgress(detail.surah.number, ayah.numberInSurah); player.selectAyah(index, true); } }}
                        onToggleFavorite={(ayah) => toggleFavoriteAyah(detail.surah.number, ayah)}
                        onShare={(ayah) => shareAyah(ayah)}
                        onOpenTafsir={(ayah) => setTafsirTarget(ayah)}
                        onQueueAyah={queueQuranAyah}
                        onAddToPlaylist={(ayah) => {
                          if (!library.playlists.length) { const title = window.prompt("Créez votre première playlist"); if (title) { createPlaylistWithAyah(title, detail.surah.number, ayah); showShareMessage("Playlist créée avec ce passage"); } return; }
                          const choice = window.prompt(`Ajouter à quelle playlist ?\n${library.playlists.map((playlist, index) => `${index + 1}. ${playlist.title}`).join("\n")}`);
                          const playlist = library.playlists[Number(choice) - 1];
                          if (playlist) {
                            if (!playlist.allowMixedContent && playlist.spokenContentIds.length > 0) { showShareMessage("Cette playlist contient des contenus parlés · activez d’abord le mélange"); return; }
                            const key = `${detail.surah.number}:${ayah}`;
                            const already = playlist.ayahKeys.includes(key);
                            toggleAyahInPlaylist(playlist.id, detail.surah.number, ayah);
                            showShareMessage(already ? `Retiré de ${playlist.title}` : `Ajouté à ${playlist.title}`);
                          }
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
                <button type="button" onClick={() => { setLibrarySection("downloads"); void refreshDownloads(); }}><Download size={19}/><span><strong>Téléchargements</strong><small>{downloads.records.filter((record) => record.status === "AVAILABLE").length} disponible(s) sur cet appareil</small></span><ChevronRight size={17}/></button>
              </section>

              {librarySection !== "all" && <button type="button" className="text-action library-back" onClick={() => { setSelectedPlaylistId(null); setLibrarySection("all"); }}>← Toute la bibliothèque</button>}
              {(librarySection === "all" || librarySection === "downloads") && <DownloadLibrary records={downloads.records} loading={downloads.loading} error={downloads.error} estimate={downloadEstimate} online={isOnline}
                onPlay={(contentId) => { const content = spokenContents.find((item) => item.id === contentId); if (content) playSpokenContent(content, true, true); }}
                onCancel={(id) => { void downloads.cancel(id).catch((error: unknown) => showShareMessage(error instanceof Error ? error.message : "Annulation impossible.")); }}
                onRemove={async (id) => { await downloads.remove(id); await refreshDownloads(); showShareMessage("Téléchargement supprimé de cet appareil."); }}
                onRetry={retryDownload} onRefresh={() => { void refreshDownloads(); }} onBrowse={() => { navigateToView("search"); setSearchType("spoken"); setQuery(""); }}/>}
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
                    {/* The playlist action reads only immutable render data; the callback itself runs after a user click. */}
                    {/* eslint-disable-next-line react-hooks/refs */}
                    <div className="section-title-row"><div><p className="eyebrow">Playlist</p><h2>{playlist.title}</h2></div><div className="playlist-title-actions"><span className="section-count">{playlist.ayahKeys.length + playlist.spokenContentIds.length}</span><button type="button" className="icon-button" aria-label="Renommer la playlist" onClick={() => { const title = window.prompt("Nouveau nom", playlist.title); if (title) renamePlaylist(playlist.id, title); }}><Pencil size={16} /></button><button type="button" className="icon-button" aria-label="Dupliquer la playlist" onClick={()=>{duplicatePlaylist(playlist.id);showShareMessage("Playlist dupliquée");}}><Plus size={16}/></button></div></div>
                    {playlist.itemOrder.length > 0 && <button type="button" className="primary-action playlist-play-all" onClick={()=>playPlaylistItem(playlist.id,0)}><Play size={16}/>Lire la playlist</button>}
                    <button type="button" role="switch" aria-checked={playlist.allowMixedContent} className="setting-toggle compact-toggle" onClick={()=>{const disabling=playlist.allowMixedContent;if(disabling&&playlist.ayahKeys.length>0&&playlist.spokenContentIds.length>0){const keep=window.prompt("Pour désactiver le mélange, tapez CORAN pour garder seulement les passages, ou PARLÉ pour garder seulement les contenus parlés.");if(keep?.trim().toLocaleUpperCase("fr")==="CORAN"){removePlaylistFormat(playlist.id,"SPOKEN");showShareMessage("Playlist conservée avec le Coran uniquement");}else if(["PARLÉ","PARLE"].includes(keep?.trim().toLocaleUpperCase("fr")??"")){removePlaylistFormat(playlist.id,"QURAN");showShareMessage("Playlist conservée avec les contenus parlés uniquement");}return;}setPlaylistMixedContent(playlist.id,!playlist.allowMixedContent);}}><span className="setting-copy"><strong>Autoriser le mélange des formats</strong><small>Coran et contenus parlés dans cette même playlist</small></span><span className="switch-track" aria-hidden="true"><i/></span></button>
                    {playlist.itemOrder.length > 0 ? <div className="mixed-playlist-items">{playlist.itemOrder.map((itemKey,index)=>{
                      const isQuran=itemKey.startsWith("quran:");
                      // The navigation callback writes pending async-load state only after a user click.
                      // eslint-disable-next-line react-hooks/refs
                      if(isQuran){const key=itemKey.slice(6);const [surahNumber,ayahNumber]=key.split(":").map(Number);const surah=surahs.find((item)=>item.number===surahNumber);return <div className="mixed-playlist-row" key={itemKey}><button type="button" className="mixed-playlist-main" onClick={()=>openSurah(surahNumber,ayahNumber)}><BookOpenText size={16}/><span><strong>{surah?.englishName ?? `Sourate ${surahNumber}`}</strong><small>{key} · Coran</small></span></button><span className="playlist-order"><button type="button" aria-label="Retirer" onClick={()=>removeAyahFromPlaylist(playlist.id,key)}><Trash2 size={15}/></button><button type="button" aria-label="Monter" disabled={index===0} onClick={()=>movePlaylistItem(playlist.id,index,index-1)}><ChevronUp size={16}/></button><button type="button" aria-label="Descendre" disabled={index===playlist.itemOrder.length-1} onClick={()=>movePlaylistItem(playlist.id,index,index+1)}><ChevronDown size={16}/></button></span></div>}
                      const contentId=itemKey.slice(7);const content=SPOKEN_CATALOG.contents.find((item)=>item.id===contentId);if(!content)return null;return <div className="mixed-playlist-row" key={itemKey}><button type="button" className="mixed-playlist-main" onClick={()=>playSpokenContent(content)}><Play size={16}/><span><strong>{content.title}</strong><small>Contenu parlé</small></span></button><span className="playlist-order"><button type="button" aria-label="Retirer" onClick={()=>toggleSpokenInPlaylist(playlist.id,contentId)}><Trash2 size={15}/></button><button type="button" aria-label="Monter" disabled={index===0} onClick={()=>movePlaylistItem(playlist.id,index,index-1)}><ChevronUp size={16}/></button><button type="button" aria-label="Descendre" disabled={index===playlist.itemOrder.length-1} onClick={()=>movePlaylistItem(playlist.id,index,index+1)}><ChevronDown size={16}/></button></span></div>;
                    })}</div> : <div className="empty-library compact"><ListMusic size={22}/><strong>Playlist vide</strong><p>Ajoutez des passages ou contenus parlés.</p></div>}

                  </div>;
                })() : library.playlists.length ? <div className="library-grid">
                  {library.playlists.map((playlist) => <div className="playlist-row" key={playlist.id}>
                    <button type="button" onClick={() => setSelectedPlaylistId(playlist.id)}><ListMusic size={18} /><div><strong>{playlist.title}</strong><small>{playlist.ayahKeys.length + playlist.spokenContentIds.length} élément{playlist.ayahKeys.length + playlist.spokenContentIds.length > 1 ? "s" : ""}</small></div><ChevronRight size={18} /></button>
                    <button type="button" className="playlist-delete" aria-label={`Supprimer ${playlist.title}`} onClick={() => { if (window.confirm(`Supprimer la playlist « ${playlist.title} » ?`)) deletePlaylist(playlist.id); }}>×</button>
                  </div>)}
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
                  <div className="empty-library"><Heart size={22} /><strong>Aucune sourate favorite</strong><p>Utilisez le cœur d’une sourate dans le catalogue pour la retrouver ici.</p><button type="button" className="secondary-action" onClick={() => navigateToView("search")}>Parcourir les sourates</button></div>
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

              <AccountPanel library={library} hydrated={hydrated} restoreLibrary={importData} />

              <PreferencesPanel
                theme={library.theme}
                appearance={library.appearance}
                readingSize={library.readingSize}
                translationSize={library.translationSize}
                autoScroll={library.autoScroll}
                showTranslation={library.showTranslation}
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
                <p>Vos notes, favoris, playlists et historique restent privés par défaut. Un compte, si vous le choisissez, sert uniquement à les synchroniser entre vos appareils.</p>
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

      {!spokenNowPlaying && <MiniPlayer
        detail={detail}
        activeIndex={activeIndex}
        status={player.status}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        onOpen={() => setPlayerOpen(true)}
        onToggle={player.toggle}
        onPrevious={previousQueueEntry}
        onNext={nextQueueEntry}
        canPrevious={canPreviousQueue}
        canNext={canNextQueue}
      />}

      {playerOpen && detail && !spokenNowPlaying && (
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
          canPrevious={canPreviousQueue}
          canNext={canNextQueue}
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
          onPrevious={previousQueueEntry}
          onNext={nextQueueEntry}
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
          onQueue={() => currentAyah && queueQuranAyah(currentAyah.numberInSurah, "end")}
        />
      )}

      {activePlaylistRun && (()=>{const playlist=library.playlists.find((item)=>item.id===activePlaylistRun.playlistId);if(!playlist)return null;return <div className="playlist-run-bar" role="status"><div><ListMusic size={16}/><span><strong>{playlist.title}</strong><small>{activePlaylistRun.index+1} / {playlist.itemOrder.length}</small></span></div><span className="playlist-run-actions"><button type="button" disabled={activePlaylistRun.index===0} onClick={()=>playPlaylistItem(playlist.id,activePlaylistRun.index-1)} aria-label="Élément précédent"><ChevronUp size={15}/></button><button type="button" disabled={activePlaylistRun.index>=playlist.itemOrder.length-1} onClick={()=>playPlaylistItem(playlist.id,activePlaylistRun.index+1)} aria-label="Élément suivant"><ChevronDown size={15}/></button><button type="button" onClick={()=>{setActivePlaylistRun(null);pausePlayback();setSpokenNowPlaying(null);}}>Arrêter</button></span></div>})()}

      {activeView === "library" && library.playbackQueue.length > 0 && <div className="queue-drawer"><PlaybackQueue queue={library.playbackQueue} currentId={queueCurrentId} onPlay={playQueueEntry} onRemove={(id)=>{setPlaybackQueue(removeQueueEntry(library.playbackQueue,id));if(id===queueCurrentId){setQueueCurrentId(null);pausePlayback();setSpokenNowPlaying(null);}}} onMove={(id,toIndex)=>setPlaybackQueue(moveQueueEntry(library.playbackQueue,id,toIndex))} onClear={()=>{setPlaybackQueue([]);setQueueCurrentId(null);pausePlayback();setSpokenNowPlaying(null);}} /></div>}
      
            {spokenNowPlaying && <UniversalSpokenPlayer
        key={spokenNowPlaying.content.id}
        content={spokenNowPlaying.content}
        asset={spokenNowPlaying.asset}
        variants={SPOKEN_CATALOG.variants ?? []}
        playbackRate={library.spokenPlaybackRate}
        autoplay={spokenAutoplay}
        compact={!spokenPlayerOpen}
        onOpen={() => setSpokenPlayerOpen(true)}
        onMinimize={() => setSpokenPlayerOpen(false)}
        artist={spokenNowPlaying.content.creatorIds.map((id) => SPOKEN_CATALOG.creators.find((creator) => creator.id === id)?.name).filter(Boolean).join(" · ")}
        onPrevious={previousSpokenEntry}
        onNext={nextSpokenEntry}
        canPrevious={canPreviousSpoken}
        canNext={canNextSpoken}
        onQueue={() => queueSpokenContent(spokenNowPlaying.content)}
        transcript={SPOKEN_CATALOG.transcripts?.find((item) => item.contentId === spokenNowPlaying.content.id)}
        transcriptSegments={SPOKEN_CATALOG.transcriptSegments ?? []}
        chapters={(SPOKEN_CATALOG.chapters ?? []).filter((item) => item.contentId === spokenNowPlaying.content.id)}
        initialPositionMs={library.spokenProgress.find((item) => item.contentId === spokenNowPlaying.content.id)?.positionMs ?? 0}
        onProgress={(positionMs, durationMs) => saveSpokenProgress(spokenNowPlaying.content.id, positionMs, durationMs)}
        onEnded={() => { if (queueCurrentId) advanceQueue(true); else advancePlaylist(); }}
        onReportIssue={() => setShareMessage("Signalement enregistré localement · envoi serveur à connecter")}
        onClose={() => { setSpokenAutoplay(false); setSpokenPlayerOpen(false); setSpokenNowPlaying(null); }}
      />}
      
            {shareMessage && <div className="action-toast" role="status" aria-live="polite">{shareMessage}</div>}

      {pendingDownload && <DownloadOptionsDialog content={pendingDownload.content} asset={pendingDownload.asset} variants={SPOKEN_CATALOG.variants ?? []} preference={pendingDownload.quality ?? library.audioQuality} wifiOnly={library.wifiOnlyDownloads}
        onClose={() => setPendingDownload(null)} onDownload={(quality, consent) => {
          const { content, asset } = pendingDownload;
          navigateToView("library");
          setLibrarySection("downloads");
          void downloads.download(content, asset, quality, { consent }).then((result) => {
            showShareMessage(result.ok ? "Disponible hors connexion sur cet appareil." : result.message ?? "Téléchargement non terminé.");
            void refreshDownloads();
          }).catch((error: unknown) => showShareMessage(error instanceof Error ? error.message : "Téléchargement impossible."));
        }}/>}

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

      <MobileNavigation activeView={activeView} onChange={navigateToView} />
    </div>
  );
}
