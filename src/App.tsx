import React, { useState } from "react";
import { MusicProvider, useMusic } from "./components/MusicContext";
import { HomeView } from "./components/views/HomeView";
import { ExploreView } from "./components/views/ExploreView";
import { RadioView } from "./components/views/RadioView";
import { DownloadsView } from "./components/views/DownloadsView";
import { LibraryView } from "./components/views/LibraryView";
import { PlaylistView } from "./components/views/PlaylistView";
import { FullscreenPlayer } from "./components/FullscreenPlayer";
import { 
  Home, 
  Search, 
  Radio, 
  Download, 
  FolderHeart, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Maximize2, 
  Database,
  Wifi,
  WifiOff, 
  Activity,
  Disc,
  Headphones,
  Check,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const MainLayout: React.FC = () => {
  const { 
    activeTab, 
    changeTab, 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    nextTrack, 
    prevTrack, 
    progress, 
    duration, 
    volume, 
    setVolumeLevel,
    downloads,
    isOfflineMode
  } = useMusic();

  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [showSyncTip, setShowSyncTip] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);

  // Mute volume toggle
  const handleMuteToggle = () => {
    if (isMuted) {
      setVolumeLevel(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolumeLevel(0);
      setIsMuted(true);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Check if current track is saved offline
  const isCurrentTrackDownloaded = currentTrack && downloads.some(d => d.id === currentTrack.id);

  // Navigations sidebar tabs
  const NAV_ITEMS = [
    { id: "home", label: "Início", icon: <Home size={18} /> },
    { id: "explore", label: "Buscar", icon: <Search size={18} /> },
    { id: "radio", label: "Rádio Ao Vivo", icon: <Radio size={18} /> },
  ];

  const COLL_ITEMS = [
    { id: "downloads", label: "Downloads / Cache", icon: <Download size={18} /> },
    { id: "library", label: "Biblioteca", icon: <FolderHeart size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-gray-200 flex flex-col md:flex-row font-sans relative overflow-x-hidden antialiased select-none">
      
      {/* 1. LEFT SIDEBAR CONSOLE (DESKTOP) */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-[#08080a] border-r border-white/5 p-6 flex-shrink-0 z-20">
        <div className="space-y-8">
          {/* Logo Brand Title */}
          <div 
            onClick={() => changeTab("home")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="p-2 bg-gradient-to-tr from-neon-green to-emerald-500 rounded-xl shadow shadow-neon-green/15 transform duration-300 group-hover:rotate-12">
              <Headphones className="text-black" size={20} />
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-lg text-white font-sans">BJC<span className="text-neon-green">music</span></span>
              <span className="block text-[8px] tracking-widest text-gray-500 uppercase font-mono mt-0.5">Stream Sound Engine</span>
            </div>
          </div>

          {/* Nav Item Section 1 */}
          <div className="space-y-2.5">
            <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono">Menu Principal</span>
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button 
                    key={item.id}
                    onClick={() => changeTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      isActive 
                        ? 'bg-neon-green/10 text-neon-green shadow-sm border-l-2 border-neon-green' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nav Item Section 2 */}
          <div className="space-y-2.5">
            <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono">Sua Coleção</span>
            <div className="space-y-1">
              {COLL_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button 
                    key={item.id}
                    onClick={() => changeTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      isActive 
                        ? 'bg-neon-green/10 text-neon-green shadow-sm border-l-2 border-neon-green' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Firebase Synchronization Sandbox status block */}
        <div className="relative border-t border-white/5 pt-4">
          <div 
            onClick={() => setShowSyncTip(!showSyncTip)}
            className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 hover:border-white/10 transition"
          >
            <div className="flex items-center gap-2">
              <Database className="text-neon-green/80 shrink-0" size={14} />
              <div className="text-left">
                <span className="block text-[9px] font-bold text-white tracking-wide">Sync Cloud Pronta</span>
                <span className="block text-[8px] text-emerald-400">DB Local Ativa (IndexedDB)</span>
              </div>
            </div>
            <ChevronRight className={`text-gray-500 shrink-0 transition-transform ${showSyncTip ? 'rotate-90' : ''}`} size={12} />
          </div>

          <AnimatePresence>
            {showSyncTip && (
              <motion.div 
                className="absolute bottom-full left-0 mb-2 w-full p-3 bg-[#0d0d12]/95 backdrop-blur-md rounded-xl border border-white/10 text-[10px] text-gray-400 space-y-1.5 shadow-2xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <p className="font-bold text-white">Preparado para Firebase!</p>
                <p className="font-light leading-relaxed">
                  Toda a arquitetura do BJCmusic está desacoplada. Fusões com Firebase Auth, Cloud Storage e Firestore estão prontas para expansão imediata de sincronização.
                </p>
                <span className="block text-[8px] text-neon-green text-right">Módulos Isolados OK</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-18 left-4 right-4 bg-[#0a0a0df0] backdrop-blur-xl border border-white/5 p-2 rounded-2xl flex items-center justify-around z-30 shadow-2xl">
        {[...NAV_ITEMS, ...COLL_ITEMS].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => changeTab(item.id)}
              className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                isActive ? 'text-neon-green scale-105' : 'text-gray-400 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium tracking-wide mt-1 capitalize">{item.id === "downloads" ? "Cached" : item.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. CENTRAL WORKSPACE SCROLLER VIEWPORT */}
      <main className="flex-1 h-screen overflow-y-auto z-10 no-scrollbar relative">
        
        {/* Dynamic Warning Notification for Offline mode in Central page head */}
        {isOfflineMode && (
          <div className="sticky top-0 z-30 bg-orange-500/10 backdrop-blur-md border-b border-orange-500/15 py-2.5 px-4 flex items-center justify-between text-xs text-orange-400">
            <span className="flex items-center gap-1.5 font-semibold">
              <WifiOff size={14} className="animate-pulse" />
              Sinal offline ativo. Somente músicas salvas locais são reproduzíveis.
            </span>
            <button 
              onClick={() => changeTab("downloads")}
              className="px-2 py-0.5 bg-orange-500/15 border border-orange-500/20 text-orange-300 rounded text-[10px] hover:bg-orange-500/30 transition shadow-inner font-semibold"
            >
              Gerenciar downloads
            </button>
          </div>
        )}

        <div className="pb-32">
          {activeTab === "home" && <HomeView />}
          {activeTab === "explore" && <ExploreView />}
          {activeTab === "radio" && <RadioView />}
          {activeTab === "downloads" && <DownloadsView />}
          {activeTab === "library" && <LibraryView />}
          {activeTab === "playlist" && <PlaylistView />}
        </div>
      </main>

      {/* 4. FIXED BOTTOM CONSOLIDATED PLAYER BLOCK */}
      <AnimatePresence>
        {currentTrack && (
          <motion.div 
            className="fixed bottom-0 md:bottom-0 left-0 right-0 bg-[#09090bf0] backdrop-blur-xl border-t border-white/5 p-4 z-40 shadow-2xl flex flex-col space-y-2 select-none"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
          >
            {/* Timeline track progress miniature bar */}
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden cursor-pointer group rounded" onClick={(e) => {
              if (currentTrack.type === "radio") return; // cannot seek radio stream
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const percentage = clickX / rect.width;
              useMusic().seekTo(Math.floor(percentage * duration));
            }}>
              <div 
                className="bg-neon-green h-full rounded-full transition-transform" 
                style={{ width: `${(progress / (duration || 1)) * 100}%` }} 
              />
            </div>

            {/* Controls Panel layout */}
            <div className="flex items-center justify-between gap-4">
              
              {/* Left track details */}
              <div 
                onClick={() => setIsFullscreenOpen(true)}
                className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
              >
                <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 shadow border border-white/5">
                  <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover transform transition-transform group-hover:scale-105" />
                  {/* Miniature audio active bar animations */}
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5 opacity-90 transition p-1.5">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="w-[3px] bg-neon-green rounded-full flex-1" 
                          style={{
                            height: `${30 + Math.random() * 60}%`,
                            animation: `bounce 0.5s ease-in-out infinite alternate ${i * 0.1}s`
                          }} 
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="min-w-0 text-left">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-neon-green transition">{currentTrack.title}</h4>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{currentTrack.artist}</p>
                  
                  {isCurrentTrackDownloaded && (
                    <span className="inline-flex items-center gap-0.5 text-[8px] uppercase tracking-wide font-bold text-emerald-400 mt-0.5">
                      <Check size={9} />
                      Conexão Offline Validada
                    </span>
                  )}
                </div>
              </div>

              {/* Central Audio Keys */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={prevTrack} 
                  className="hidden sm:block text-gray-400 hover:text-white hover:scale-105 transition"
                  title="Anterior"
                >
                  <SkipBack size={18} />
                </button>

                <button 
                  onClick={togglePlay}
                  className="p-3 bg-white hover:bg-neon-green text-black hover:scale-105 transition rounded-full shadow"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
                </button>

                <button 
                  onClick={nextTrack}
                  className="text-gray-400 hover:text-white hover:scale-105 transition"
                  title="Próxima"
                >
                  <SkipForward size={18} />
                </button>
              </div>

              {/* Right secondary settings deck */}
              <div className="flex items-center gap-3 flex-1 justify-end">
                {/* Volume slider */}
                <div className="hidden lg:flex items-center gap-2 select-none">
                  <button onClick={handleMuteToggle} className="text-gray-400 hover:text-white transition">
                    {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                  <input 
                    type="range" 
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolumeLevel(parseFloat(e.target.value));
                      if (isMuted) setIsMuted(false);
                    }}
                    className="accent-neon-green bg-neutral-800 h-1 w-20 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Timeline status label */}
                <div className="hidden sm:block font-mono text-[10px] text-gray-500">
                  {formatTime(progress)} / {formatTime(duration)}
                </div>

                {/* Fullscreen modal toggle button */}
                <button 
                  onClick={() => setIsFullscreenOpen(true)}
                  className="p-2 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-105 rounded-full text-white transition border border-white/5"
                  title="Cinema Mode (Letras e Equalizador)"
                >
                  <Maximize2 size={13} />
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. FULLSCREEN CINEMA OVERLAY LAYER */}
      <AnimatePresence>
        {isFullscreenOpen && (
          <FullscreenPlayer onClose={() => setIsFullscreenOpen(false)} />
        )}
      </AnimatePresence>

      {/* 6. CYBERPUNK VIDEO TERMINAL / VISUALIZER */}
      <div 
        className={`fixed bottom-24 right-4 z-40 bg-[#08080dfa] border border-white/5 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden flex flex-col ${
          showTerminal ? 'w-64 h-48 opacity-100 scale-100' : 'w-48 h-10 opacity-75 scale-100 hover:opacity-100'
        }`}
      >
        <div 
          onClick={() => setShowTerminal(!showTerminal)}
          className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer bg-black/40 border-b border-white/5 hover:bg-white/5 transition select-none"
        >
          <span className="text-[10px] uppercase tracking-widest text-[#2fcf77] font-bold flex items-center gap-1.5 font-mono">
            <Disc size={11} className={`text-neon-green ${isPlaying ? 'animate-spin' : ''}`} />
            {currentTrack ? "VÍDEO TERMINAL" : "SINAL PRONTO"}
          </span>
          <button className="text-[9px] text-[#2fcf77]/80 hover:text-white font-mono font-bold uppercase">
            {showTerminal ? "[ MINIMIZAR ]" : "[ EXPANDIR ]"}
          </button>
        </div>
        
        {/* The persistent YouTube iframe mount point */}
        <div className={`flex-1 bg-black relative ${showTerminal ? 'block' : 'hidden'}`}>
          <div id="bjcmusic-yt-player-target" className="absolute inset-0 w-full h-full pointer-events-auto" />
        </div>
      </div>

    </div>
  );
};

export default function App() {
  return (
    <MusicProvider>
      <MainLayout />
    </MusicProvider>
  );
}
