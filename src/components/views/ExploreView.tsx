import React, { useState, useEffect } from "react";
import { useMusic } from "../MusicContext";
import { Track } from "../../types";
import { Search, Loader2, Play, Heart, Download, Plus, Music, Disc, ArrowLeftRight, Check, ListMusic } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const POPULAR_GENRES = [
  { name: "Pop", query: "pop pop" },
  { name: "Rock", query: "rock classic" },
  { name: "Eletrônica", query: "electronic tech house" },
  { name: "Sertanejo", query: "sertanejo" },
  { name: "Lo-Fi", query: "lofi study chillout" },
  { name: "Jazz", query: "jazz instrumental" },
];

export const ExploreView: React.FC = () => {
  const { 
    searchSongs, 
    searchResults, 
    isSearchLoading, 
    playTrack, 
    favorites, 
    toggleFavorite, 
    downloads, 
    toggleDownload,
    playlists,
    addTrackToPlaylistId,
    createNewPlaylist
  } = useMusic();

  const [inputVal, setInputVal] = useState("");
  const [activeTab, setActiveTab2] = useState<"results" | "genres">("genres");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [newPlName, setNewPlName] = useState("");
  const [showCreatePl, setShowCreatePl] = useState(false);

  // Debounce search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputVal.trim()) {
        searchSongs(inputVal);
        setActiveTab2("results");
      } else {
        setActiveTab2("genres");
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [inputVal]);

  const handleGenreClick = (query: string) => {
    setInputVal(query);
    searchSongs(query);
    setActiveTab2("results");
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="p-6 md:p-8 space-y-6 pb-32 text-gray-200"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">Buscar</h1>
        <p className="text-xs text-gray-400">Descubra milhões de faixas reais alimentadas pelas APIs de streaming mundiais.</p>
      </div>

      {/* Modern High-Contrast Search Bar with Glow */}
      <motion.div 
        className="relative max-w-xl group"
        variants={itemVariants}
      >
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-neon-green transition-colors">
          {isSearchLoading ? (
            <Loader2 className="animate-spin text-neon-green" size={18} />
          ) : (
            <Search size={18} />
          )}
        </span>
        <input 
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Músicas, artistas ou álbuns..."
          className="w-full pl-11 pr-4 py-3.5 bg-[#0e0e13] hover:bg-[#121219] focus:bg-[#070709] border border-white/5 focus:border-neon-green/40 rounded-full text-sm text-white placeholder-gray-500 focus:outline-none transition shadow-inner focus:shadow-neon-green/5"
        />
        {inputVal && (
          <button 
            onClick={() => setInputVal("")}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-gray-500 hover:text-white transition"
          >
            Limpar
          </button>
        )}
      </motion.div>

      {/* Grid of genres or instant lookup outcomes */}
      <AnimatePresence mode="wait">
        {activeTab === "genres" ? (
          <motion.div 
            key="genres"
            className="space-y-5 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider block">Gêneros Populares</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {POPULAR_GENRES.map((g, i) => (
                <div 
                  key={g.name}
                  onClick={() => handleGenreClick(g.query)}
                  className="relative h-28 rounded-xl overflow-hidden cursor-pointer group shadow border border-white/5 bg-gradient-to-br from-[#101015] to-[#040406] flex items-center justify-center text-center p-4 transition hover:border-neon-green/30 hover:scale-[1.02]"
                >
                  <div className="absolute inset-0 bg-neon-green/5 mix-blend-multiply transition group-hover:bg-neon-green/10" />
                  <span className="font-bold text-white tracking-wide group-hover:text-neon-green transition flex items-center gap-1.5 text-sm">
                    <Disc size={14} className="animate-pulse text-neon-green/60 group-hover:rotate-185 duration-1000" />
                    {g.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="results"
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-400">Resultados para "{inputVal}"</h3>
              <p className="text-[10px] uppercase tracking-widest text-[#2fcf77] font-semibold flex items-center gap-1">
                <ArrowLeftRight size={10} />
                Streaming em tempo real
              </p>
            </div>

            {searchResults.length === 0 && !isSearchLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500 space-y-2">
                <Music size={40} className="text-gray-600 mb-2" />
                <p className="font-medium text-sm text-gray-300">Nenhum resultado encontrado</p>
                <p className="text-xs">Verifique a ortografia ou tente pesquisar outro termo.</p>
              </div>
            ) : (
              <div className="bg-[#0b0b0f]/80 backdrop-blur-md rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden">
                {searchResults.map((track, i) => {
                  const isFav = favorites.some((f) => f.id === track.id);
                  const isDl = downloads.some((d) => d.id === track.id);
                  const isPlayingMenu = activeMenuId === track.id;

                  return (
                    <div 
                      key={track.id}
                      className="flex items-center justify-between p-3.5 hover:bg-[#121218]/70 transition group block"
                    >
                      {/* Left: album details and play trigger */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer" onClick={() => playTrack(track, searchResults)}>
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Play size={14} fill="currentColor" className="text-neon-green" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-white truncate group-hover:text-neon-green transition">{track.title}</h4>
                          <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                        </div>
                      </div>

                      {/* Right: duration & action buttons */}
                      <div className="flex items-center gap-3.5 text-xs text-gray-400 relative">
                        <span className="hidden sm:inline font-mono text-[10px]">{formatDuration(track.duration)}</span>
                        
                        {/* Favorites */}
                        <button 
                          onClick={() => toggleFavorite(track)}
                          className={`p-1.5 rounded-full transition-all ${isFav ? 'text-red-500 hover:text-red-400 scale-105' : 'text-gray-400 hover:text-white hover:scale-105'}`}
                          title="Favoritar"
                        >
                          <Heart size={15} fill={isFav ? "currentColor" : "none"} />
                        </button>

                        {/* Download simulation */}
                        <button 
                          onClick={() => toggleDownload(track)}
                          className={`p-1.5 rounded-full transition-all ${isDl ? 'text-neon-green hover:text-emerald-400' : 'text-gray-400 hover:text-white'}`}
                          title="Download Offline (Cache)"
                        >
                          <Download size={15} className={isDl ? "animate-pulse" : ""} />
                        </button>

                        {/* Add to Custom Playlist button toggle */}
                        <div className="relative">
                          <button 
                            onClick={() => setActiveMenuId(isPlayingMenu ? null : track.id)}
                            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition"
                            title="Adicionar à Playlist"
                          >
                            <Plus size={15} />
                          </button>

                          {/* Float dynamic playlist selection dropdown */}
                          {isPlayingMenu && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                              <div className="absolute right-0 bottom-full mb-2 z-50 w-56 bg-[#101016]/95 backdrop-blur-md rounded-xl border border-white/10 p-2 shadow-2xl space-y-1 text-left">
                                <span className="block px-2.5 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Incluir na playlist</span>
                                
                                {playlists.length === 0 ? (
                                  <span className="block text-[10px] text-gray-400 p-2 text-center font-light">Nenhuma playlist personalizada.</span>
                                ) : (
                                  <div className="max-h-32 overflow-y-auto divide-y divide-white/5">
                                    {playlists.map((pl) => {
                                      const hasTrack = pl.tracks.some(t => t.id === track.id);
                                      return (
                                        <button 
                                          key={pl.id}
                                          onClick={() => {
                                            addTrackToPlaylistId(pl.id, track);
                                            setActiveMenuId(null);
                                          }}
                                          className="w-full text-xs text-left px-2 py-1.5 rounded hover:bg-[#1c1c28] flex items-center justify-between text-white transition"
                                        >
                                          <span className="truncate">{pl.name}</span>
                                          {hasTrack ? <Check size={12} className="text-neon-green" /> : <Plus size={12} />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                                
                                <div className="border-t border-white/5 pt-2">
                                  {showCreatePl ? (
                                    <div className="space-y-1.5 p-1">
                                      <input 
                                        type="text" 
                                        value={newPlName}
                                        onChange={(e) => setNewPlName(e.target.value)}
                                        placeholder="Nome..."
                                        className="w-full bg-black/40 text-xs rounded border border-white/10 p-1 text-white focus:outline-none focus:border-neon-green"
                                      />
                                      <button 
                                        onClick={async () => {
                                          if (newPlName.trim()) {
                                            await createNewPlaylist(newPlName);
                                            setNewPlName("");
                                            setShowCreatePl(false);
                                          }
                                        }}
                                        className="w-full bg-neon-green hover:bg-emerald-400 transition text-black font-semibold text-[10px] py-1 rounded"
                                      >
                                        Criar e adicionar
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => setShowCreatePl(true)}
                                      className="w-full text-left px-2.5 py-1 text-[10px] text-neon-green font-semibold flex items-center gap-1 hover:underline"
                                    >
                                      Nova Playlist...
                                    </button>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
