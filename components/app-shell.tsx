"use client";

import {
  BookOpenText,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Headphones,
  Heart,
  History,
  Library,
  LoaderCircle,
  Play,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Video,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AyahList } from "@/components/ayah-list";
import { FullPlayer } from "@/components/full-player";
import { MiniPlayer } from "@/components/mini-player";
import { MobileNavigation, type AppView } from "@/components/mobile-navigation";
import { PreferencesPanel } from "@/components/preferences-panel";
import { QuranSearchResults } from "@/components/quran-search-results";
import { SourceDisclosure } from "@/components/source-disclosure";
import { SurahBrowser } from "@/components/surah-browser";
import { useLocalLibrary } from "@/hooks/use-local-library";
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

function FutureContent() {
  return (
    <section className="future-card" aria-labelledby="future-content-title">
      <div className="future-icon-stack" aria-hidden="true">
        <span><Headphones size={23} /></span>
        <span><Video size={23} /></span>
        <span><Radio size={23} /></span>
      </div>
      <div>
        <p className="eyebrow">Prochaine étape</p>
        <h2 id="future-content-title">Podcasts, conférences et vidéos</h2>
        <p>
          Ces catalogues restent volontairement désactivés jusqu’à la validation des licences et au branchement de sources réelles.
        </p>
      </div>
      <span className="future-status"><ShieldCheck size={15} /> Aucun faux contenu</span>
    </section>
  );
}

function DesktopNavigation({
  activeView,
  onChange,
}: {
  activeView: AppView;
  onChange: (view: AppView) => void;
}) {
  const items = [
    { id: "home" as const, label: "Accueil", icon: Sparkles },
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
            <Icon size={19} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-proof">
        <CheckCircle2 size={17} />
        <div><strong>Version fonctionnelle</strong><small>Audio et données réels</small></div>
      </div>
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
    setPlaybackRate,
    setRepeatMode,
    setShowTranslation,
  } = useLocalLibrary();

  const libraryRef = useRef(library);

  useEffect(() => {
    libraryRef.current = library;
  }, [library]);

  useEffect(() => {
    document.documentElement.dataset.theme = library.theme;
  }, [library.theme]);

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
  const [playerOpen, setPlayerOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [sleepTimerEndsAt, setSleepTimerEndsAt] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(0);
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
    if (hasValidLink) setActiveView("quran");
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
  });

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
        player.pause();
        setSleepTimerEndsAt(null);
      }
    };
    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [player.pause, sleepTimerEndsAt]);

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
      player.loadedSourceUrl !== ayah.audioUrl
    ) {
      return;
    }
    player.seek(requestedPosition / 1000);
    if (requestedAutoplayRef.current) player.play();
    requestedPositionRef.current = null;
    requestedAutoplayRef.current = false;
  }, [activeIndex, detail, player.loadedSourceUrl, player.play, player.seek]);

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
        player.loadedSourceUrl === detail.ayahs[nextIndex]?.audioUrl
      ) {
        player.seek(positionMs / 1000);
        if (autoplay) player.play();
        requestedPositionRef.current = null;
        requestedAutoplayRef.current = false;
      } else {
        player.selectAyah(nextIndex, false);
      }
      return;
    }

    setActiveIndex(0);
    setDetail(null);
    setSelectedNumber(number);
    setActiveView("quran");
  }, [activeIndex, detail, player.loadedSourceUrl, player.play, player.seek, player.selectAyah]);

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
    () => library.listeningHistory.slice(0, 8),
    [library.listeningHistory],
  );

  const currentAyah = detail?.ayahs[activeIndex] ?? null;
  const currentAyahKey = detail && currentAyah ? `${detail.surah.number}:${currentAyah.numberInSurah}` : "";
  const currentAyahFavorite = currentAyahKey ? library.favoriteAyahs.includes(currentAyahKey) : false;

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
      text: `${ayah.arabicText}\n${ayah.frenchText}`,
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
      <DesktopNavigation activeView={activeView} onChange={setActiveView} />

      <div className="app-main">
        <header className="topbar">
          <button type="button" className="mobile-brand" onClick={() => setActiveView("home")} aria-label="RIHLA, accueil">
            <span className="brand-mark" aria-hidden="true">ر</span>
            <strong>RIHLA</strong>
          </button>
          <div className="topbar-context">
            <span>Coran audio & texte synchronisé</span>
            <small><Cloud size={13} /> Données réelles</small>
          </div>
          <button type="button" className="topbar-library" onClick={() => setActiveView("library")}>
            <Heart size={17} />
            <span>{library.favoriteSurahs.length + library.favoriteAyahs.length}</span>
          </button>
        </header>

        <main className={`page-content view-${activeView}`}>
          {activeView === "home" && (
            <div className="content-stack">
              <section className="home-intro">
                <p className="eyebrow">Assalamu alaykum</p>
                <h1>Le Coran, à écouter et à suivre.</h1>
                <p>Choisissez une sourate, lancez une récitation réelle et suivez chaque ayah avec sa traduction française.</p>
              </section>

              <section className="quran-hero">
                <div className="hero-art" aria-hidden="true">
                  <span className="hero-orbit one" />
                  <span className="hero-orbit two" />
                  <span className="hero-number">{String(selectedNumber).padStart(3, "0")}</span>
                  <span className="hero-arabic" lang="ar" dir="rtl" translate="no">{detail?.surah.name ?? selectedSummary?.name ?? "القرآن"}</span>
                </div>
                <div className="hero-copy">
                  <p className="eyebrow">{library.lastSurah === selectedNumber ? "Reprendre ma lecture" : "Prêt à écouter"}</p>
                  <h2>{detail?.surah.englishName ?? selectedSummary?.englishName ?? "Le Coran"}</h2>
                  <p>{detail?.surah.frenchName ?? selectedSummary?.frenchName ?? "Chargement de la sourate…"}</p>
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
                <div className="hero-proof">
                  <div><strong>114</strong><span>sourates réelles</span></div>
                  <div><strong>{RECITERS.length}</strong><span>récitateurs</span></div>
                  <div><History size={19} /><span>reprise locale</span></div>
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

              <FutureContent />
            </div>
          )}

          {activeView === "search" && (
            <div className="content-stack">
              <section className="page-intro">
                <p className="eyebrow">Recherche réelle</p>
                <h1>Trouvez une sourate ou une ayah.</h1>
                <p>Recherchez un nom, un mot dans la traduction française ou une référence comme 2:255.</p>
              </section>
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
                searchPlaceholder="Sourate, mot ou référence 2:255"
              />
              <QuranSearchResults query={query} onOpen={(surah, ayah) => openSurah(surah, ayah)} />
            </div>
          )}

          {activeView === "quran" && (
            <div className="content-stack quran-view-stack">
              <section className="page-intro compact">
                <p className="eyebrow">Lecture et écoute</p>
                <h1>Le Coran</h1>
                <p>Sélectionnez une sourate ou une ayah. Le player suit le média réel.</p>
              </section>
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
                      <select value={reciterId} onChange={(event) => setReciterId(event.target.value)}>
                        {RECITERS.map((reciter) => <option value={reciter.id} key={reciter.id}>{reciter.name}</option>)}
                      </select>
                    </label>
                    <div className="reading-actions">
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
                        duration={player.duration}
                        favoriteAyahs={library.favoriteAyahs}
                        showTranslation={library.showTranslation}
                        onSelect={(index) => player.selectAyah(index, true)}
                        onToggleFavorite={(ayah) => toggleFavoriteAyah(detail.surah.number, ayah)}
                        onToggleTranslation={() => setShowTranslation(!library.showTranslation)}
                        onShare={(ayah) => shareAyah(
                          ayah,
                          currentAyah?.numberInSurah === ayah ? player.currentTime * 1000 : 0,
                        )}
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
              <section className="page-intro">
                <p className="eyebrow">Sur cet appareil</p>
                <h1>Votre bibliothèque.</h1>
                <p>Vos sourates, ayat et position de reprise sont enregistrées localement.</p>
              </section>

              <section className="library-summary">
                <div><Heart size={20} /><strong>{library.favoriteSurahs.length}</strong><span>sourates favorites</span></div>
                <div><BookOpenText size={20} /><strong>{library.favoriteAyahs.length}</strong><span>ayat sauvegardées</span></div>
                <div><History size={20} /><strong>{formatPlaybackTime(library.lastPositionMs)}</strong><span>{library.lastSurah}:{library.lastAyah} · dernière position</span></div>
              </section>

              <section className="library-section">
                <div className="section-title-row"><div><p className="eyebrow">Reprendre</p><h2>Historique d’écoute</h2></div></div>
                {recentHistory.length ? (
                  <div className="history-list">
                    {recentHistory.map((item) => {
                      const surah = surahs.find((candidate) => candidate.number === item.surah);
                      const progress = item.durationMs > 0
                        ? Math.min(100, (item.positionMs / item.durationMs) * 100)
                        : 0;
                      return (
                        <button
                          type="button"
                          className="history-item"
                          key={`${item.surah}:${item.ayah}`}
                          onClick={() => openSurah(item.surah, item.ayah, item.positionMs, true)}
                        >
                          <span className="history-reference">{item.surah}:{item.ayah}</span>
                          <span className="history-copy">
                            <strong>{surah?.englishName ?? `Sourate ${item.surah}`} · Ayah {item.ayah}</strong>
                            <small>{formatHistoryDate(item.updatedAt)} · repris à {formatPlaybackTime(item.positionMs)}</small>
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
              </section>

              <section className="library-section">
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
              </section>

              <section className="library-section">
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
                  <div className="empty-library compact"><BookOpenText size={22} /><strong>Aucune ayah sauvegardée</strong><p>Les ayat marquées apparaîtront ici.</p></div>
                )}
              </section>

              <PreferencesPanel theme={library.theme} onThemeChange={setTheme} />

              <FutureContent />
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
        onNext={player.next}
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
          onSetSleepTimer={setSleepTimer}
          onShare={() => currentAyah && shareAyah(currentAyah.numberInSurah, player.currentTime * 1000)}
        />
      )}

      {shareMessage && <div className="action-toast" role="status">{shareMessage}</div>}

      <MobileNavigation activeView={activeView} onChange={setActiveView} />
    </div>
  );
}
