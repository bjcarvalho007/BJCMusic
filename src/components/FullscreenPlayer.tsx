import React, { useEffect, useState, useRef } from "react";
import { useMusic } from "./MusicContext";
import { X, Play, Pause, SkipForward, SkipBack, Volume2, Music, ListMusic, AlignCenter, Flame, Check, Sparkles, Disc } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LyricLine {
  timeCode: number; // in seconds
  text: string;
}

export const FullscreenPlayer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { 
    currentTrack, 
    isPlaying, 
    progress, 
    duration, 
    volume, 
    setVolumeLevel, 
    togglePlay, 
    nextTrack, 
    prevTrack, 
    seekTo, 
    lyrics, 
    isLyricsLoading, 
    queue, 
    playTrack,
    speed,
    setPlaybackSpeed
  } = useMusic();

  const [activeTab, setActiveTab] = useState<"lyrics" | "queue" | "equalizer">("lyrics");
  const [crossfade, setCrossfade] = useState(2); // simulated crossfade timing
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  // Parse [MM:SS] timestamp codes from Gemini's live lyrics output
  useEffect(() => {
    if (lyrics) {
      const lines = lyrics.split("\n");
      const tempParsed: LyricLine[] = [];
      
      lines.forEach((line) => {
        const matches = line.match(/\[(\d+):(\d+)\](.*)/);
        if (matches) {
          const mins = parseInt(matches[1]);
          const secs = parseInt(matches[2]);
          const text = matches[3].trim();
          tempParsed.push({
            timeCode: mins * 60 + secs,
            text: text
          });
        } else {
          // If no timestamp code found, append with estimated incremental timing or omit brackets
          const cleanLine = line.replace(/\[.*\]/, "").trim();
          if (cleanLine) {
            tempParsed.push({
              timeCode: tempParsed.length > 0 ? tempParsed[tempParsed.length - 1].timeCode + 4 : 0,
              text: cleanLine
            });
          }
        }
      });

      // Sort by time
      tempParsed.sort((a, b) => a.timeCode - b.timeCode);
      setParsedLyrics(tempParsed);
    } else {
      setParsedLyrics([]);
    }
  }, [lyrics]);

  // Track active lyric line index based on current playback progress
  useEffect(() => {
    if (parsedLyrics.length > 0) {
      let activeIdx = -1;
      for (let i = 0; i < parsedLyrics.length; i++) {
        if (progress >= parsedLyrics[i].timeCode) {
          activeIdx = i;
        } else {
          break;
        }
      }
      setCurrentLineIndex(activeIdx);

      // Auto scroll container to center-align the active lyric line
      if (activeIdx !== -1 && lyricsContainerRef.current) {
        const activeElem = lyricsContainerRef.current.children[activeIdx] as HTMLElement;
        if (activeElem) {
          lyricsContainerRef.current.scrollTo({
            top: activeElem.offsetTop - lyricsContainerRef.current.clientHeight / 2 + activeElem.clientHeight / 2,
            behavior: "smooth"
          });
        }
      }
    }
  }, [progress, parsedLyrics]);

  if (!currentTrack) return null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-[#060608] z-50 overflow-hidden flex flex-col justify-between text-white md:p-8 p-6"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 120 }}
    >
      {/* Background cinematic radial blur */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <div 
          className="absolute inset-x-0 top-0 h-[60%] blur-[250px] opacity-35 transition-all duration-1000 bg-center bg-cover scale-150 rounded-full" 
          style={{ backgroundImage: `url('${currentTrack.coverUrl}')` }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/90 to-transparent" />
      </div>

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 text-xs text-neon-green font-semibold">
          <Sparkles size={14} className="animate-pulse" />
          <span>CINEMA MODE ACTIVE</span>
        </div>

        {/* Action controls */}
        <button 
          onClick={onClose}
          className="p-2.5 bg-white/5 border border-white/5 hover:border-white/20 select-none cursor-pointer rounded-full hover:scale-105 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* MAIN BODY GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-center my-6 max-h-[72%] overflow-hidden z-10">
        
        {/* LEFT COMPARTMENT: DISK ROTATION (Columns 1-5) */}
        <div className="lg:col-span-5 flex flex-col items-center text-center space-y-6">
          
          {/* Glowing Vinyl Disk Record wrapper */}
          <div className="relative w-56 sm:w-72 md:w-80 aspect-square flex-shrink-0 select-none">
            {/* outer neon glow ring */}
            <div className="absolute inset-0 bg-gradient-to-tr from-neon-green/20 via-transparent to-emerald-500/10 blur-xl animate-pulse rounded-full" />
            
            {/* spinning record frame */}
            <motion.div 
              className="w-full h-full bg-black rounded-full p-2.5 shadow-2xl relative border-4 border-[#121217] flex items-center justify-center cursor-pointer"
              animate={isPlaying ? { rotate: 360 } : {}}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
            >
              {/* Vinyl lines representation */}
              <div className="absolute inset-3 border border-neutral-800/40 rounded-full" />
              <div className="absolute inset-7 border border-neutral-800/60 rounded-full" />
              <div className="absolute inset-12 border border-neutral-800/80 rounded-full" />
              
              {/* Center art image disc */}
              <div className="w-[45%] h-[45%] rounded-full overflow-hidden relative border-8 border-black shadow">
                <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                {/* Center spindle hole */}
                <div className="absolute inset-0 m-auto w-3.5 h-3.5 bg-[#060608] rounded-full border border-black shadow-inner" />
              </div>
            </motion.div>
          </div>

          {/* Title Artist details banner */}
          <div className="space-y-1.5 max-w-sm">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight truncate text-white">{currentTrack.title}</h2>
            <p className="text-sm text-neon-green truncate tracking-wide font-medium">{currentTrack.artist}</p>
            <p className="text-xs text-gray-400/80 truncate font-light italic">{currentTrack.album || "BJCmusic Stream"}</p>
          </div>
        </div>

        {/* RIGHT COMPARTMENT: INTERACTIVE MULTI-TAB (Columns 6-12) */}
        <div className="lg:col-span-7 h-full flex flex-col bg-white/5 border border-white/5 rounded-2xl md:p-6 p-4 overflow-hidden relative max-h-[460px] lg:max-h-[500px]">
          
          {/* Tab Selection Header */}
          <div className="flex items-center justify-around border-b border-white/5 pb-3">
            <button 
              onClick={() => setActiveTab("lyrics")}
              className={`text-xs font-semibold px-4 py-1.5 rounded-full transition flex items-center gap-1.5 select-none ${
                activeTab === "lyrics" ? 'bg-neon-green text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              <AlignCenter size={13} />
              Letras Live
            </button>
            <button 
              onClick={() => setActiveTab("queue")}
              className={`text-xs font-semibold px-4 py-1.5 rounded-full transition flex items-center gap-1.5 select-none ${
                activeTab === "queue" ? 'bg-neon-green text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ListMusic size={13} />
              Fila ({queue.length})
            </button>
            <button 
              onClick={() => setActiveTab("equalizer")}
              className={`text-xs font-semibold px-4 py-1.5 rounded-full transition flex items-center gap-1.5 select-none ${
                activeTab === "equalizer" ? 'bg-neon-green text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Flame size={13} />
              Predefinições
            </button>
          </div>

          {/* TAB BODY INNER SCROLLS */}
          <div className="flex-1 mt-4 overflow-hidden relative">
            
            {/* TA 1: LYRICS ACTIVE FLOW */}
            {activeTab === "lyrics" && (
              <div className="h-full">
                {isLyricsLoading ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500 space-y-3">
                    <div className="animate-spin text-neon-green">
                      <Disc size={24} />
                    </div>
                    <p className="text-xs text-gray-400 font-mono font-light">Buscando letra inteligente via Gemini API...</p>
                  </div>
                ) : parsedLyrics.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center text-gray-500 text-xs font-light">
                    Sem letras formatadas disponíveis.
                  </div>
                ) : (
                  <div 
                    ref={lyricsContainerRef}
                    className="h-full overflow-y-auto no-scrollbar py-20 space-y-8 select-none text-center"
                    style={{ scrollBehavior: "smooth" }}
                  >
                    {parsedLyrics.map((line, idx) => {
                      const isActive = idx === currentLineIndex;
                      return (
                        <div 
                          key={idx}
                          onClick={() => seekTo(line.timeCode)}
                          className={`text-sm md:text-base font-semibold px-4 py-1 cursor-pointer transition-all duration-300 ${
                            isActive 
                              ? 'text-neon-green scale-105 text-base md:text-lg drop-shadow-[0_0_8px_rgba(47,207,119,0.2)]' 
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {line.text}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: QUEUE FLOW */}
            {activeTab === "queue" && (
              <div className="h-full flex flex-col justify-between">
                <div className="h-[90%] overflow-y-auto divide-y divide-white/5 pr-1 no-scrollbar">
                  <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider pb-2.5">Proxima faixa agendada</span>
                  
                  {queue.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500 font-light">
                      Fila vazia. O BJCmusic recomeçará esta faixa após o término.
                    </div>
                  ) : (
                    queue.map((track, i) => (
                      <div 
                        key={track.id}
                        onClick={() => playTrack(track, queue)}
                        className="flex items-center justify-between py-3.5 hover:bg-white/5 cursor-pointer rounded-lg px-2 text-left group transition block"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img src={track.coverUrl} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white group-hover:text-neon-green truncate">{track.title}</h5>
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">{track.artist}</p>
                          </div>
                        </div>
                        <Play size={11} fill="currentColor" className="text-neon-green opacity-0 group-hover:opacity-100 transition mr-1" />
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-white/5 pt-2.5 text-center">
                  <span className="text-[10px] text-gray-500 select-none">A fila reorganiza-se de forma dinâmica após cada escuta.</span>
                </div>
              </div>
            )}

            {/* TAB 3: EQUALIZER PRESETS CONTROLS */}
            {activeTab === "equalizer" && (
              <div className="h-full overflow-y-auto no-scrollbar space-y-6 pt-2 text-left select-none">
                
                {/* Simulated speed selection */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest block">Velocidade do Player ({speed}x)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0.5, 1.0, 1.5, 2.0].map((s) => (
                      <button 
                        key={s}
                        onClick={() => setPlaybackSpeed(s)}
                        className={`py-1.5 rounded-lg text-xs font-semibold border transition ${
                          speed === s 
                            ? 'bg-neon-green text-black border-transparent' 
                            : 'bg-black/20 text-gray-400 border-white/5 hover:border-white/10'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated crossfade configuration */}
                <div className="space-y-2 pl-0.5">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                    <span>Crossfade de Transição</span>
                    <span className="text-neon-green font-mono">{crossfade}s</span>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={12} 
                    value={crossfade}
                    onChange={(e) => setCrossfade(parseInt(e.target.value))}
                    className="w-full accent-neon-green bg-neutral-900"
                  />
                  <p className="text-[10px] text-gray-500">Faz a música misturar-se suavemente nos últimos segundos regulados.</p>
                </div>

                {/* Simulated graphic dynamic equalizer bars */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#2fcf77] tracking-widest block">Sintetizador Estéreo Ativo</span>
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-end justify-center h-24 gap-1.5">
                    {Array.from({ length: 16 }).map((_, i) => {
                      // Alternate animations or random heights
                      const durationVal = 0.5 + Math.random() * 0.8;
                      return (
                        <motion.div 
                          key={i}
                          className="w-1.5 bg-gradient-to-t from-emerald-600 via-neon-green to-white rounded-full flex-1"
                          animate={isPlaying ? { height: ["10%", "90%", "20%"] } : { height: "10%" }}
                          transition={{ repeat: Infinity, duration: durationVal, ease: "easeInOut" }}
                        />
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* FOOTER CONTROLLER ACTIONS */}
      <div className="z-10 bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl md:p-5 p-4 space-y-4 max-w-4xl mx-auto w-full">
        
        {/* Slider Timeline Progress bar */}
        <div className="space-y-1.5 select-none">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-1">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="relative w-full h-1.5 rounded-full bg-white/10 overflow-hidden cursor-pointer group" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            seekTo(Math.floor(percentage * duration));
          }}>
            <div className="bg-neon-green h-full rounded-full transition-transform active:scale-x-105" style={{ width: `${(progress / (duration || 1)) * 100}%` }} />
          </div>
        </div>

        {/* Audio buttons panel center aligning */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Volume layout slider for large screens */}
          <div className="hidden sm:flex items-center gap-2.5 w-1/4 select-none">
            <Volume2 size={15} className="text-gray-400" />
            <input 
              type="range" 
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
              className="accent-neon-green bg-neutral-800 h-1 w-24 rounded-lg cursor-pointer"
            />
          </div>

          {/* Central play actions */}
          <div className="flex items-center justify-center gap-5 flex-1 max-w-xs mx-auto">
            <button 
              onClick={prevTrack}
              className="text-gray-400 hover:text-white hover:scale-105 transition"
            >
              <SkipBack size={21} />
            </button>

            <button 
              onClick={togglePlay}
              className="p-3.5 bg-white text-black hover:bg-neon-green hover:scale-105 transition-all rounded-full shadow"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>

            <button 
              onClick={nextTrack}
              className="text-gray-400 hover:text-white hover:scale-105 transition"
            >
              <SkipForward size={21} />
            </button>
          </div>

          {/* Placeholder column balance */}
          <div className="hidden sm:block w-1/4 text-right text-xs uppercase font-semibold text-gray-500 font-mono select-none">
            Estéreo HQ Audio Loop
          </div>

        </div>

      </div>

    </motion.div>
  );
};
