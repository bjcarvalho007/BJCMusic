import React, { useEffect, useState } from "react";
import { useMusic } from "../MusicContext";
import { Radio, Play, Loader2, Sparkles, Earth, Disc, Flame, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const RADIO_TAGS = ["lofi", "jazz", "synthwave", "chillout", "electronic", "techno", "rock", "pop", "classical"];

export const RadioView: React.FC = () => {
  const { 
    radioStations, 
    radioGenre, 
    isRadioLoading, 
    fetchRadioStations, 
    playTrack, 
    currentTrack, 
    isPlaying 
  } = useMusic();

  const [tunerFrequency, setTunerFrequency] = useState("98.1");

  useEffect(() => {
    fetchRadioStations(radioGenre);
  }, []);

  const handleTagClick = (tag: string) => {
    fetchRadioStations(tag);
    // Randomize fictional FM frequency dial for immersive fun
    const freq = (87.5 + Math.random() * 20).toFixed(1);
    setTunerFrequency(freq);
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

  const isCurrentRadioActive = currentTrack && currentTrack.type === "radio" && isPlaying;

  return (
    <motion.div 
      className="p-6 md:p-8 space-y-6 pb-32 text-gray-200"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Radio className="text-neon-green animate-pulse" size={28} />
            Estações de Rádio
          </h1>
          <p className="text-xs text-gray-400">Transmissão ao vivo de centenas de canais globais sem delays de satélite.</p>
        </div>

        {/* Dynamic connection indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className={`w-2.5 h-2.5 rounded-full ${isCurrentRadioActive ? 'bg-neon-green animate-ping' : 'bg-red-500/80 animate-pulse'}`} />
          <span className="text-[11px] tracking-wider uppercase">
            {isCurrentRadioActive ? "SINAL RECEBIDO - SINTONIZADO" : "SINTONIZADOR PRONTO"}
          </span>
        </div>
      </div>

      {/* Cybernetic Tuner Cockpit Section! */}
      <motion.div 
        className="relative bg-gradient-to-br from-[#0c0c11] via-[#040406] to-[#12121c] border border-white/5 p-6 rounded-2xl shadow-xl space-y-4 overflow-hidden"
        variants={itemVariants}
      >
        {/* Glow backdrop effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-neon-green/5 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-green/3 blur-2xl rounded-full" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Dial frequency layout */}
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[9px] uppercase tracking-widest text-[#2fcf77] font-bold block">Frequência Sintonizada</span>
            <div className="flex items-baseline justify-center md:justify-start gap-1">
              <span className="text-4xl md:text-5xl font-mono text-white tracking-tighter">
                {isCurrentRadioActive ? ((90.0 + (parseFloat(currentTrack?.id ? currentTrack.id.replace(/[^\d]/g, '') : "1") % 18)).toFixed(1)) : tunerFrequency}
              </span>
              <span className="text-xs font-semibold text-neon-green">MHz FM</span>
            </div>
          </div>

          {/* Tuner frequency scale lines */}
          <div className="hidden lg:flex flex-1 items-center justify-around h-10 border border-white/5 bg-black/40 px-4 rounded-lg overflow-hidden mx-8 select-none">
            {Array.from({ length: 25 }).map((_, idx) => {
              const isActive = idx === 12;
              return (
                <div 
                  key={idx} 
                  className={`w-0.5 transition-all ${
                    isActive 
                      ? 'h-8 bg-neon-green animate-pulse' 
                      : (idx % 5 === 0 ? 'h-5 bg-gray-500' : 'h-3 bg-gray-700/60')
                  }`} 
                />
              );
            })}
          </div>

          {/* Sintonizer dial dashboard */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl">
            <Earth className="text-neon-green text-xs" size={16} />
            <div className="text-xs">
              <div className="font-semibold text-white truncate max-w-[140px]">
                {isCurrentRadioActive ? currentTrack?.title : "Aguardando canal..."}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">
                {isCurrentRadioActive ? currentTrack?.artist : "Modulação Global"}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative waves animation */}
        {isCurrentRadioActive && (
          <div className="flex items-center gap-1.5 justify-center py-2 relative">
            <span className="text-[10px] text-neon-green uppercase font-semibold font-mono tracking-widest absolute left-0 bottom-1">LOCK ON SEAMLESS STEAM</span>
            <div className="flex items-center gap-0.5 pointer-events-none">
              {Array.from({ length: 40 }).map((_, idx) => {
                const randHeight = 5 + Math.random() * 32;
                return (
                  <motion.div 
                    key={idx}
                    className="w-[3px] bg-gradient-to-t from-emerald-500 to-neon-green rounded-full"
                    animate={{ height: [randHeight * 0.4, randHeight, randHeight * 0.3] }}
                    transition={{ repeat: Infinity, duration: 0.8 + (idx % 5) * 0.1, ease: "easeInOut" }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* Genres and filter categories block */}
      <div className="space-y-3">
        <h4 className="text-xs uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
          <Sparkles size={12} className="text-neon-green" />
          Filtro Temático de Satélite
        </h4>
        <div className="flex items-center gap-2 pb-1 overflow-x-auto no-scrollbar scroll-smooth">
          {RADIO_TAGS.map((tag) => {
            const isSelected = radioGenre === tag;
            return (
              <button 
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold capitalize transition border ${
                  isSelected 
                    ? 'bg-neon-green text-black border-transparent shadow shadow-neon-green/10' 
                    : 'bg-[#0f0f13]/80 text-gray-400 hover:text-white border-white/5 hover:border-white/10'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of streaming channels list */}
      <div className="space-y-4 pt-1">
        <h3 className="text-sm font-semibold text-gray-400">Canais de Rádio Reais ({radioGenre})</h3>

        {isRadioLoading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-3">
            <Loader2 className="animate-spin text-neon-green" size={28} />
            <p className="text-xs text-gray-400 font-light font-mono">Conectando aos satélites da Radio-Browser Cloud...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {radioStations.map((station) => {
              const isPlayingS = currentTrack?.id === station.id && isPlaying;
              return (
                <div 
                  key={station.id}
                  onClick={() => playTrack(station, radioStations)}
                  className="bg-[#0b0b0f]/60 hover:bg-[#121218]/90 border border-white/5 hover:border-neon-green/20 rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer group shadow hover:shadow-neon-green/3 transition-all duration-300"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden bg-black/40 flex items-center justify-center border border-white/5">
                      {station.coverUrl ? (
                        <img src={station.coverUrl} alt={station.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100";
                        }} />
                      ) : (
                        <Radio size={18} className="text-gray-500 group-hover:text-neon-green transition" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <Play size={14} fill="currentColor" className="text-neon-green" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold tracking-tight text-white group-hover:text-neon-green transition truncate">{station.title}</h4>
                      <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">{station.artist}</p>
                      <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-semibold text-emerald-500 truncate max-w-[150px]">
                        {station.album || "Rádio"}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isPlayingS ? (
                      <div className="p-2 bg-neon-green/15 text-neon-green rounded-full">
                        <Volume2 size={15} className="animate-bounce" />
                      </div>
                    ) : (
                      <div className="p-2 bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10 rounded-full transition">
                        <Play size={13} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
