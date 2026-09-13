"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Bookmark,
  ChevronRight,
  Clock3,
  Download,
  Headphones,
  Heart,
  Home,
  Languages,
  Library,
  ListMusic,
  Mic2,
  MoreHorizontal,
  Pause,
  Play,
  Search,
  Settings2,
  SkipBack,
  SkipForward,
  Sparkles,
  UserRound,
  Volume2,
  X,
} from "lucide-react";

type View = "home" | "search" | "library" | "profile";

type MediaCardData = {
  title: string;
  subtitle: string;
  meta: string;
  gradient: string;
  mark: string;
};

const navItems: Array<{
  id: View;
  label: string;
  icon: typeof Home;
}> = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "search", label: "Recherche", icon: Search },
  { id: "library", label: "Bibliothèque", icon: Library },
  { id: "profile", label: "Profil", icon: UserRound },
];

const continueItems: MediaCardData[] = [
  {
    title: "Tafsir d’Al-Baqara",
    subtitle: "Série · 12 épisodes",
    meta: "Épisode 4 · 31 min restantes",
    gradient: "linear-gradient(145deg, #756343, #272117)",
    mark: "تدبر",
  },
  {
    title: "Les histoires des prophètes",
    subtitle: "Série · Othman Iquioussen",
    meta: "Épisode 7 · 42 min",
    gradient: "linear-gradient(145deg, #405e58, #15211f)",
    mark: "سيرة",
  },
  {
    title: "Cultiver la patience",
    subtitle: "Conférence · Rachid Abou Houdeyfa",
    meta: "18:42 sur 54:08",
    gradient: "linear-gradient(145deg, #6b5144, #261a16)",
    mark: "صبر",
  },
];

const recitations: MediaCardData[] = [
  {
    title: "Ar-Rahmān",
    subtitle: "Mishary Rashid Alafasy",
    meta: "Sourate 55 · 78 ayat",
    gradient: "linear-gradient(150deg, #9a8350, #342b17)",
    mark: "الرحمن",
  },
  {
    title: "Yā-Sīn",
    subtitle: "Maher Al Muaiqly",
    meta: "Sourate 36 · 83 ayat",
    gradient: "linear-gradient(150deg, #4f7565, #18251f)",
    mark: "يس",
  },
  {
    title: "Al-Mulk",
    subtitle: "Abdul Rahman Al-Sudais",
    meta: "Sourate 67 · 30 ayat",
    gradient: "linear-gradient(150deg, #735d74, #271c29)",
    mark: "الملك",
  },
  {
    title: "Al-Kahf",
    subtitle: "Saad Al Ghamdi",
    meta: "Sourate 18 · 110 ayat",
    gradient: "linear-gradient(150deg, #3c6079, #14212a)",
    mark: "الكهف",
  },
];

const discovery: MediaCardData[] = [
  {
    title: "20 minutes de rappel",
    subtitle: "Playlist éditoriale",
    meta: "15 contenus",
    gradient: "linear-gradient(145deg, #7b593f, #2c1d13)",
    mark: "٢٠",
  },
  {
    title: "Comprendre la Sîra",
    subtitle: "Cours · Niveau débutant",
    meta: "9 épisodes",
    gradient: "linear-gradient(145deg, #505f3d, #1d2414)",
    mark: "سيرة",
  },
  {
    title: "Au calme avant de dormir",
    subtitle: "Playlist éditoriale",
    meta: "48 min",
    gradient: "linear-gradient(145deg, #384868, #151b29)",
    mark: "ليل",
  },
  {
    title: "Les noms d’Allah",
    subtitle: "Série · 21 épisodes",
    meta: "Mis à jour hier",
    gradient: "linear-gradient(145deg, #6d5941, #271f15)",
    mark: "الحسنى",
  },
];

const verses = [
  {
    number: 153,
    start: 0,
    end: 58,
    arabic:
      "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    translation:
      "Ô vous qui croyez ! Cherchez secours dans l’endurance et la prière. Car Allah est avec ceux qui sont endurants.",
  },
  {
    number: 154,
    start: 58,
    end: 118,
    arabic:
      "وَلَا تَقُولُوا لِمَن يُقْتَلُ فِي سَبِيلِ اللَّهِ أَمْوَاتٌ ۚ بَلْ أَحْيَاءٌ وَلَٰكِن لَّا تَشْعُرُونَ",
    translation:
      "Et ne dites pas de ceux qui sont tués dans le sentier d’Allah qu’ils sont morts. Au contraire, ils sont vivants, mais vous n’en avez pas conscience.",
  },
  {
    number: 155,
    start: 118,
    end: 187,
    arabic:
      "وَلَنَبْلُوَنَّكُم بِشَيْءٍ مِّنَ الْخَوْفِ وَالْجُوعِ وَنَقْصٍ مِّنَ الْأَمْوَالِ وَالْأَنفُسِ وَالثَّمَرَاتِ ۗ وَبَشِّرِ الصَّابِرِينَ",
    translation:
      "Très certainement, Nous vous éprouverons par un peu de peur, de faim et de diminution de biens, de personnes et de fruits. Et fais la bonne annonce aux endurants.",
  },
  {
    number: 156,
    start: 187,
    end: 252,
    arabic:
      "الَّذِينَ إِذَا أَصَابَتْهُم مُّصِيبَةٌ قَالُوا إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ",
    translation:
      "Ceux qui disent, quand un malheur les atteint : Certes nous sommes à Allah, et c’est à Lui que nous retournerons.",
  },
];

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function MediaCard({ item, onPlay }: { item: MediaCardData; onPlay: () => void }) {
  return (
    <article className="media-card">
      <button className="cover-button" type="button" onClick={onPlay} aria-label={`Lire ${item.title}`}>
        <span className="media-cover" style={{ background: item.gradient }}>
          <span className="cover-orbit" aria-hidden="true" />
          <span className="cover-mark" lang="ar" dir="rtl">
            {item.mark}
          </span>
          <span className="cover-play" aria-hidden="true">
            <Play size={18} fill="currentColor" />
          </span>
        </span>
      </button>
      <div className="card-copy">
        <h3>{item.title}</h3>
        <p>{item.subtitle}</p>
        <span>{item.meta}</span>
      </div>
    </article>
  );
}

function SectionHeader({ title, action = "Tout afficher" }: { title: string; action?: string }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      <button type="button">
        {action} <ChevronRight size={16} />
      </button>
    </div>
  );
}

function HomeView({
  onPlay,
  onTranscript,
}: {
  onPlay: () => void;
  onTranscript: () => void;
}) {
  return (
    <div className="view-stack">
      <section className="welcome-line">
        <div>
          <p>Dimanche 13 septembre</p>
          <h1>Assalamu alaykum, Sacha</h1>
        </div>
        <button className="icon-button mobile-bell" type="button" aria-label="Notifications">
          <Bell size={20} />
        </button>
      </section>

      <section className="quran-hero" aria-labelledby="continue-quran-title">
        <div className="quran-art" aria-hidden="true">
          <span className="arch arch-one" />
          <span className="arch arch-two" />
          <span className="surah-number">02</span>
          <span className="surah-arabic" lang="ar" dir="rtl">
            البقرة
          </span>
          <span className="surah-latin">AL-BAQARA</span>
        </div>
        <div className="quran-hero-copy">
          <span className="eyebrow">
            <BookOpen size={14} /> Continuer ma lecture
          </span>
          <h2 id="continue-quran-title">Al-Baqara</h2>
          <p className="hero-subtitle">Ayah 153 · Mishary Rashid Alafasy</p>
          <div className="progress-label">
            <span>Juz 2</span>
            <span>37 %</span>
          </div>
          <div className="progress-track" aria-label="Progression de la sourate : 37 %">
            <span style={{ width: "37%" }} />
          </div>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={onPlay}>
              <Play size={17} fill="currentColor" /> Reprendre à 27:43
            </button>
            <button className="secondary-button" type="button" onClick={onTranscript}>
              <BookOpen size={17} /> Afficher le Coran
            </button>
          </div>
        </div>
        <div className="daily-ayah">
          <div className="daily-ayah-topline">
            <span>Ayah en cours</span>
            <button type="button" aria-label="Sauvegarder le verset">
              <Bookmark size={17} />
            </button>
          </div>
          <p className="daily-arabic" lang="ar" dir="rtl">
            إِنَّ اللَّهَ مَعَ الصَّابِرِينَ
          </p>
          <p>« Car Allah est avec ceux qui sont endurants. »</p>
          <span>Al-Baqara · 2:153</span>
        </div>
      </section>

      <section>
        <SectionHeader title="Reprendre l’écoute" />
        <div className="continue-grid">
          {continueItems.map((item) => (
            <MediaCard key={item.title} item={item} onPlay={onPlay} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Récitations populaires" />
        <div className="horizontal-rail">
          {recitations.map((item) => (
            <MediaCard key={item.title} item={item} onPlay={onPlay} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Explorer selon votre moment" />
        <div className="horizontal-rail">
          {discovery.map((item) => (
            <MediaCard key={item.title} item={item} onPlay={onPlay} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SearchView({ onPlay }: { onPlay: () => void }) {
  const [query, setQuery] = useState("patience");
  const normalized = query.trim().toLocaleLowerCase("fr");
  const hasQuery = normalized.length > 0;

  return (
    <div className="view-stack search-view">
      <section className="page-intro">
        <span className="eyebrow">Recherche universelle</span>
        <h1>Retrouvez une idée, jusque dans les mots.</h1>
      </section>
      <label className="search-field">
        <Search size={21} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Sourate, sujet, intervenant ou phrase…"
          aria-label="Rechercher dans tout le catalogue"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Effacer la recherche">
            <X size={18} />
          </button>
        )}
      </label>
      <div className="filter-row" aria-label="Filtres de recherche">
        {['Tout', 'Coran', 'Audio', 'Vidéo', 'Transcriptions'].map((filter, index) => (
          <button className={index === 0 ? "active" : ""} type="button" key={filter}>
            {filter}
          </button>
        ))}
      </div>

      {hasQuery ? (
        <section className="search-results">
          <div className="result-summary">
            <p>Résultats pour « {query} »</p>
            <span>12 résultats dans 5 types de contenus</span>
          </div>

          <article className="featured-result">
            <div className="result-icon quran-result">
              <BookOpen size={22} />
            </div>
            <div>
              <span className="result-type">Coran · Traduction française</span>
              <h2>Al-Baqara, ayah 153</h2>
              <p>
                Ô vous qui croyez ! Cherchez secours dans l’endurance et la prière. Car Allah est avec ceux qui sont <mark>endurants</mark>.
              </p>
            </div>
            <button className="round-play" type="button" onClick={onPlay} aria-label="Lire le verset">
              <Play size={18} fill="currentColor" />
            </button>
          </article>

          <div className="transcript-result-list">
            <SectionHeader title="Dans les transcriptions" action="8 passages" />
            {[
              ["Cultiver la patience dans l’épreuve", "Conférence · Rachid Abou Houdeyfa", "18:42", "La patience n’est pas l’attente passive. Elle est une manière de tenir son cap…"],
              ["Le cœur face aux difficultés", "Podcast · Chemins intérieurs", "07:16", "À cet instant, la patience prend tout son sens : elle protège nos actes et nos mots…"],
              ["Tafsir d’Al-Baqara · Épisode 4", "Cours · Dr. Yacine Qasmi", "31:08", "Le verset relie directement l’endurance à la prière, comme deux appuis…"],
            ].map(([title, meta, time, excerpt]) => (
              <button className="transcript-hit" type="button" key={title} onClick={onPlay}>
                <span className="timestamp">{time}</span>
                <span className="hit-copy">
                  <strong>{title}</strong>
                  <small>{meta}</small>
                  <span>{excerpt}</span>
                </span>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="empty-search">
          <Sparkles size={24} />
          <h2>Commencez par un sujet</h2>
          <p>Essayez « patience », « Ramadan » ou le nom d’une sourate.</p>
        </section>
      )}
    </div>
  );
}

function LibraryView({ onPlay }: { onPlay: () => void }) {
  const shortcuts = [
    { label: "Favoris", count: "38 contenus", icon: Heart },
    { label: "Téléchargements", count: "12 contenus", icon: Download },
    { label: "Historique", count: "Mis à jour aujourd’hui", icon: Clock3 },
    { label: "Ayat sauvegardées", count: "24 versets", icon: Bookmark },
  ];

  return (
    <div className="view-stack">
      <section className="page-intro compact">
        <span className="eyebrow">Votre espace</span>
        <h1>Bibliothèque</h1>
        <p>Vos écoutes, lectures et passages importants, au même endroit.</p>
      </section>
      <div className="library-shortcuts">
        {shortcuts.map(({ label, count, icon: Icon }) => (
          <button type="button" key={label}>
            <span className="shortcut-icon"><Icon size={21} /></span>
            <span><strong>{label}</strong><small>{count}</small></span>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
      <section>
        <SectionHeader title="Playlists" action="3 playlists" />
        <div className="horizontal-rail">
          {discovery.slice(0, 3).map((item) => (
            <MediaCard key={item.title} item={item} onPlay={onPlay} />
          ))}
        </div>
      </section>
      <section>
        <SectionHeader title="Suivis récemment" action="Gérer" />
        <div className="creator-list">
          {["Mishary Rashid Alafasy", "Chemins intérieurs", "Dr. Yacine Qasmi"].map((name, index) => (
            <button type="button" key={name}>
              <span className={`creator-avatar avatar-${index + 1}`}><Mic2 size={20} /></span>
              <span><strong>{name}</strong><small>{index === 1 ? "Podcast" : "Récitant · Intervenant"}</small></span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProfileView() {
  return (
    <div className="view-stack profile-view">
      <section className="profile-card">
        <div className="profile-avatar">SR</div>
        <div>
          <span className="eyebrow">Profil d’écoute</span>
          <h1>Sacha</h1>
          <p>Français · Arabe · Anglais</p>
        </div>
        <button className="secondary-button" type="button">Modifier</button>
      </section>
      <section className="listening-stats">
        <div><strong>7 h 24</strong><span>écoutées ce mois</span></div>
        <div><strong>3</strong><span>sourates poursuivies</span></div>
        <div><strong>24</strong><span>ayat sauvegardées</span></div>
      </section>
      <section className="settings-list">
        <h2>Préférences</h2>
        {[
          [Languages, "Langues et traductions", "Français · Sahih International"],
          [Headphones, "Qualité audio", "Élevée"],
          [BookOpen, "Préférences Coran", "Texte arabe + traduction"],
          [Settings2, "Paramètres", "Compte, notifications, confidentialité"],
        ].map(([Icon, label, value]) => {
          const ItemIcon = Icon as typeof Languages;
          return (
            <button type="button" key={label as string}>
              <span className="settings-icon"><ItemIcon size={20} /></span>
              <span><strong>{label as string}</strong><small>{value as string}</small></span>
              <ChevronRight size={18} />
            </button>
          );
        })}
      </section>
    </div>
  );
}

function QuranPanel({
  currentTime,
  onClose,
  onSeek,
}: {
  currentTime: number;
  onClose: () => void;
  onSeek: (value: number) => void;
}) {
  const activeIndex = Math.max(0, verses.findIndex((verse) => currentTime >= verse.start && currentTime < verse.end));

  return (
    <div className="panel-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="quran-panel" role="dialog" aria-modal="true" aria-labelledby="quran-panel-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="panel-header">
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fermer le Coran">
            <ArrowLeft size={20} />
          </button>
          <div>
            <span>Al-Baqara</span>
            <h2 id="quran-panel-title">Afficher le Coran</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Options d’affichage">
            <Settings2 size={20} />
          </button>
        </header>
        <div className="panel-tools">
          <button type="button" className="active"><BookOpen size={15} /> Ayah</button>
          <button type="button"><Languages size={15} /> Traduction</button>
          <button type="button"><Search size={15} /> Rechercher</button>
        </div>
        <div className="verse-list">
          {verses.map((verse, index) => (
            <button
              type="button"
              className={`verse-row ${index === activeIndex ? "active" : ""}`}
              key={verse.number}
              onClick={() => onSeek(verse.start)}
            >
              <span className="verse-number">2:{verse.number}</span>
              <span className="verse-content">
                <span className="verse-arabic" lang="ar" dir="rtl">{verse.arabic}</span>
                <span className="verse-translation">{verse.translation}</span>
              </span>
              {index === activeIndex && <span className="playing-bars" aria-label="Verset en cours"><i /><i /><i /></span>}
            </button>
          ))}
        </div>
        <footer className="panel-source">
          <span>Texte coranique</span>
          <p>Source et traduction à sélectionner lors de la connexion à Quran Foundation.</p>
        </footer>
      </aside>
    </div>
  );
}

export default function HomePage() {
  const [activeView, setActiveView] = useState<View>("home");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(42);
  const [showTranscript, setShowTranscript] = useState(false);
  const duration = 252;

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setCurrentTime((time) => (time >= duration ? 0 : time + 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPlaying]);

  const activeAyah = useMemo(() => {
    return verses.find((verse) => currentTime >= verse.start && currentTime < verse.end) ?? verses[0];
  }, [currentTime]);

  const play = () => setIsPlaying(true);

  return (
    <main className="app-shell">
      <aside className="desktop-sidebar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>RIHLA <small>prototype</small></span>
        </div>
        <nav aria-label="Navigation principale">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              className={activeView === id ? "active" : ""}
              onClick={() => setActiveView(id)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-collection">
          <span>Votre collection</span>
          <button type="button"><Heart size={18} /> Favoris <small>38</small></button>
          <button type="button"><Bookmark size={18} /> Passages <small>24</small></button>
          <button type="button"><Download size={18} /> Hors ligne <small>12</small></button>
        </div>
        <div className="sidebar-note">
          <span className="note-icon"><Sparkles size={16} /></span>
          <p><strong>Votre semaine</strong>3 h 12 d’écoute attentive</p>
        </div>
      </aside>

      <section className="main-column">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <strong>RIHLA</strong>
          </div>
          <button className="global-search" type="button" onClick={() => setActiveView("search")}>
            <Search size={18} />
            <span>Rechercher un mot, une sourate, une phrase…</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="Notifications"><Bell size={19} /></button>
            <button className="avatar-button" type="button" onClick={() => setActiveView("profile")} aria-label="Ouvrir le profil">SR</button>
          </div>
        </header>

        <div className="content-scroll">
          {activeView === "home" && <HomeView onPlay={play} onTranscript={() => setShowTranscript(true)} />}
          {activeView === "search" && <SearchView onPlay={play} />}
          {activeView === "library" && <LibraryView onPlay={play} />}
          {activeView === "profile" && <ProfileView />}
        </div>
      </section>

      <nav className="mobile-nav" aria-label="Navigation principale mobile">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button type="button" key={id} className={activeView === id ? "active" : ""} onClick={() => setActiveView(id)}>
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <section className="mini-player" aria-label="Lecteur en cours">
        <button className="mini-art" type="button" onClick={() => setShowTranscript(true)} aria-label="Ouvrir le lecteur">
          <span>02</span>
          <small lang="ar" dir="rtl">البقرة</small>
        </button>
        <button className="track-info" type="button" onClick={() => setShowTranscript(true)}>
          <strong>Al-Baqara · Ayah {activeAyah.number}</strong>
          <span>Mishary Rashid Alafasy</span>
        </button>
        <div className="desktop-player-controls">
          <div className="control-buttons">
            <button type="button" aria-label="Précédent"><SkipBack size={18} /></button>
            <button className="main-play" type="button" onClick={() => setIsPlaying((value) => !value)} aria-label={isPlaying ? "Mettre en pause" : "Lire"}>
              {isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
            </button>
            <button type="button" aria-label="Suivant"><SkipForward size={18} /></button>
          </div>
          <div className="player-timeline">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={(event) => setCurrentTime(Number(event.target.value))}
              aria-label="Position de lecture"
              style={{ "--progress": `${(currentTime / duration) * 100}%` } as React.CSSProperties}
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <div className="player-actions">
          <button type="button" onClick={() => setShowTranscript(true)} aria-label="Afficher le Coran"><BookOpen size={19} /></button>
          <button type="button" aria-label="Ajouter aux favoris"><Heart size={19} /></button>
          <button type="button" aria-label="File d’attente"><ListMusic size={19} /></button>
          <button className="volume-button" type="button" aria-label="Volume"><Volume2 size={18} /></button>
          <button className="mobile-play" type="button" onClick={() => setIsPlaying((value) => !value)} aria-label={isPlaying ? "Mettre en pause" : "Lire"}>
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <button className="more-button" type="button" aria-label="Plus d’options"><MoreHorizontal size={19} /></button>
        </div>
        <span className="mobile-progress" style={{ width: `${(currentTime / duration) * 100}%` }} />
      </section>

      {showTranscript && (
        <QuranPanel currentTime={currentTime} onClose={() => setShowTranscript(false)} onSeek={(value) => { setCurrentTime(value); setIsPlaying(true); }} />
      )}
    </main>
  );
}
