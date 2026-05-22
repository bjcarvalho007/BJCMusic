import React, { useEffect, useMemo } from "react";
import { useMusic } from "../MusicContext";
import { Track, Playlist } from "../../types";
import { Play, Flame, TrendingUp, Sparkles, Clock, Headphones, Award, Star, History, Music } from "lucide-react";
import { motion } from "motion/react";

// Curated preset definitions
export const ALBUM_PRESETS: Playlist[] = [
  {
    id: "neon_dreams",
    name: "Neon Dreams",
    description: "Synthwave e Retrobeats para focar ou dirigir à noite.",
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600",
    tracks: [
      { id: "syn_1", title: "Blinding Lights", artist: "The Weeknd", album: "Neon Dreams", coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300", youtubeId: "4NRXx6U8ABQ", duration: 200, type: "song" },
      { id: "syn_2", title: "Starboy", artist: "The Weeknd", album: "Neon Dreams", coverUrl: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=300", youtubeId: "34Na4j8AVgA", duration: 230, type: "song" },
      { id: "syn_3", title: "Midnight City", artist: "M83", album: "Retro Future", coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300", youtubeId: "dX3k_MQxml0", duration: 243, type: "song" },
      { id: "syn_4", title: "Nightcall", artist: "Kavinsky", album: "Outrun", coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300", youtubeId: "MV_3Dpw-BRY", duration: 258, type: "song" }
    ]
  },
  {
    id: "top_brasil",
    name: "Top Brasil 2026",
    description: "Hits mais quentes do Brasil nas paradas nacionais.",
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600",
    tracks: [
      { id: "br_1", title: "Sintomas de Prazer", artist: "Ludmilla", album: "Vilã", coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300", youtubeId: "O20eD4yZ_l8", duration: 142, type: "song" },
      { id: "br_2", title: "Envolver", artist: "Anitta", album: "Versions of Me", coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300", youtubeId: "hFCJu1_0L_Q", duration: 193, type: "song" },
      { id: "br_3", title: "La Danza", artist: "Baco Exu do Gomes", album: "QVVJFA", coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300", youtubeId: "jSByoP2j8G4", duration: 184, type: "song" },
      { id: "br_4", title: "Piloto", artist: "Flora Matos", album: "Flora", coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300", youtubeId: "W9V-lO0U6YQ", duration: 180, type: "song" }
    ]
  },
  {
    id: "focus_lofi",
    name: "Confort Lofi Studio",
    description: "Batidas calmas e aconchegantes para focar ou descansar.",
    coverUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600",
    tracks: [
      { id: "lofi_1", title: "Lofi Hip Hop Study Beats", artist: "Lofi Girl", album: "Focus Lofi", coverUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=300", youtubeId: "jfKfPfyJRdk", duration: 320, type: "song" },
      { id: "lofi_2", title: "Snowman (Lofi Version)", artist: "Lofi Beats", album: "Winter Vibes", coverUrl: "https://images.unsplash.com/photo-1482440308425-276ad0f28b19?w=300", youtubeId: "9y6Z5_HiafM", duration: 175, type: "song" },
      { id: "lofi_3", title: "Sunset Lover", artist: "Petit Biscuit", album: "Presence", coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300", youtubeId: "3ZleK7NfMec", duration: 237, type: "song" }
    ]
  }
];

export const HomeView: React.FC = () => {
  const { 
    playTrack, 
    changeTab, 
    stats, 
    favorites,
    currentTrack,
    historyList,
    smartRecs,
    isRecsLoading,
    loadRecommendations
  } = useMusic();

  // Load smart recommendations if they are empty and there exists some listening history or active song
  useEffect(() => {
    if (smartRecs.length === 0 && (currentTrack || historyList.length > 0)) {
      loadRecommendations().catch(err => console.error("Could not fetch user micro-recs:", err));
    }
  }, [currentTrack, historyList.length, smartRecs.length, loadRecommendations]);

  // Compute profile affinity dynamically from play history and favorites
  const profileAffinity = useMemo(() => {
    if (historyList.length === 0) {
      return {
        topArtist: "Explorador Musical",
        topGenre: "Neutro / Aguardando Histórico",
        genreClass: "border-emerald-500/10 text-emerald-400 bg-emerald-500/5",
        statusMsg: "Toque músicas no aplicativo para ativar a personalização dinâmica do seu espaço."
      };
    }

    // Identify top artist
    const artistCounts: Record<string, number> = {};
    historyList.forEach(t => {
      if (t.artist) {
        artistCounts[t.artist] = (artistCounts[t.artist] || 0) + 1;
      }
    });

    let topArtist = "Eclético";
    let topArtistCount = 0;
    Object.entries(artistCounts).forEach(([artist, count]) => {
      if (count > topArtistCount) {
        topArtist = artist;
        topArtistCount = count;
      }
    });

    // Detect style category based on history track titles/artists
    let topGenre = "Pop Moderno";
    let genreClass = "border-pink-500/10 text-pink-400 bg-pink-500/5";
    let statusMsg = `Especialmente sintonizado no seu artista favorito, ${topArtist}!`;

    const rawText = historyList.map(t => `${t.title} ${t.artist}`).join(" ").toLowerCase();
    
    if (rawText.includes("lofi") || rawText.includes("study") || rawText.includes("beats") || rawText.includes("girl") || rawText.includes("biscuit")) {
      topGenre = "Confort Lofi Studio";
      genreClass = "border-amber-500/15 text-amber-400 bg-amber-500/5";
      statusMsg = "Sua interface se adaptou para o modo de concentração e paz ☕";
    } else if (rawText.includes("weeknd") || rawText.includes("m83") || rawText.includes("kavinsky") || rawText.includes("neon") || rawText.includes("blinding")) {
      topGenre = "Synthwave / Cyberpunk";
      genreClass = "border-indigo-500/15 text-indigo-400 bg-indigo-500/5";
      statusMsg = "Sua interface está sintonizada na onda cibernética noturna Retro 🌌";
    } else if (rawText.includes("ludmilla") || rawText.includes("anitta") || rawText.includes("baco") || rawText.includes("flora") || rawText.includes("sintomas")) {
      topGenre = "Pop, R&B & Ritmos do Brasil";
      genreClass = "border-emerald-500/15 text-emerald-400 bg-emerald-500/5";
      statusMsg = "Interface adaptada com foco no melhor do Pop e R&B nacional 🔥";
    }

    return { topArtist, topGenre, genreClass, statusMsg };
  }, [historyList]);

  // Dynamic Spotlights derived from user aesthetics
  const adaptiveSpotlight = useMemo(() => {
    const genre = profileAffinity.topGenre.toLowerCase();
    if (genre.includes("lofi")) {
      return {
        title: "Confort Lofi Studio",
        desc: "Batidas calmas, aconchegantes e relaxantes para focar, escrever códigos ou descansar sob um manto hifi.",
        coverUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1200",
        track: ALBUM_PRESETS[2].tracks[0],
        context: ALBUM_PRESETS[2].tracks,
        playlist: ALBUM_PRESETS[2]
      };
    } else if (genre.includes("synthwave") || genre.includes("cyberpunk")) {
      return {
        title: "Neon Dreams: Synthwave Synth",
        desc: "Retrobeats e timbres analógicos sci-fi para focar ou dirigir de noite sob as luzes neon das estradas.",
        coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200",
        track: ALBUM_PRESETS[0].tracks[0],
        context: ALBUM_PRESETS[0].tracks,
        playlist: ALBUM_PRESETS[0]
      };
    }
    // Default Spotlight Pop Brasil
    return {
      title: "Sintomas de Prazer: Ludmilla Tour",
      desc: "Sinta o calor das batidas irresistíveis do R&B e Pop nacional misturado ao balanço carioca.",
      coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200",
      track: ALBUM_PRESETS[1].tracks[0],
      context: ALBUM_PRESETS[1].tracks,
      playlist: ALBUM_PRESETS[1]
    };
  }, [profileAffinity]);

  // Unique layout animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div 
      className="p-6 md:p-8 space-y-8 pb-32 text-gray-200"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* 1. DYNAMIC ADAPTIVE WELCOME HEADING */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${profileAffinity.genreClass}`}>
              SINTONIA: {profileAffinity.topGenre}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-1">
            {historyList.length > 0 ? `Seu Espaço Adaptativo` : "Sua sintonia premium"}
          </h1>
          <p className="text-sm text-gray-400">
            {profileAffinity.statusMsg}
          </p>
        </motion.div>

        {/* Dynamic Status Badges */}
        <motion.div 
          className="flex items-center gap-2 flex-wrap" 
          variants={itemVariants}
        >
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <Sparkles size={12} className="animate-pulse" />
            SINAL INTELIGENTE ATIVO
          </span>
          <span className="px-3 py-1 bg-neon-green/15 text-neon-green border border-neon-green/20 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <Award size={12} />
            HI-FI INTEGRADO
          </span>
        </motion.div>
      </div>

      {/* 2. CINEMATIC ADAPTIVE SPOTLIGHT BANNER */}
      <motion.div 
        className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl group border border-white/5"
        variants={itemVariants}
      >
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${adaptiveSpotlight.coverUrl}')` }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 md:p-8 space-y-3 md:max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-neon-green text-black text-[10px] font-bold rounded">DESTAQUE DO SEU GOSTO</span>
            <span className="text-xs text-gray-300 font-medium">Recomendado</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white drop-shadow-md">
            {adaptiveSpotlight.title}
          </h2>
          <p className="text-xs md:text-sm text-gray-400 font-light leading-relaxed">
            {adaptiveSpotlight.desc}
          </p>
          <div className="flex items-center gap-4 pt-1">
            <button 
              onClick={() => playTrack(adaptiveSpotlight.track, adaptiveSpotlight.context)}
              className="px-5 py-2.5 bg-neon-green text-black hover:bg-white hover:text-black hover:scale-105 transition-all text-sm font-semibold rounded-full flex items-center gap-2 shadow-lg hover:shadow-neon-green/20"
              id="banner-play-btn"
            >
              <Play size={16} fill="currentColor" />
              Ouvir Agora
            </button>
            <button 
              onClick={() => changeTab("playlist", adaptiveSpotlight.playlist)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white transition rounded-full text-sm font-medium border border-white/10"
            >
              Ver Detalhes
            </button>
          </div>
        </div>
      </motion.div>

      {/* 3. "SUA MIX DE AFINIDADE INTELIGENTE" (GEMINI AI BASED RECS) */}
      <div className="space-y-4">
        <motion.div className="flex items-center justify-between" variants={itemVariants}>
          <div className="flex items-center gap-2">
            <Sparkles className="text-neon-green animate-pulse" size={20} />
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white">Recomendações de Inteligência Artificial</h3>
              <p className="text-xs text-gray-400">Modelagem preditiva dinâmica baseada na sua atividade e artistas que gosta</p>
            </div>
          </div>
          {historyList.length > 0 && (
            <button 
              onClick={() => loadRecommendations()}
              className="text-xs text-neon-green hover:text-white transition uppercase tracking-widest font-bold"
              disabled={isRecsLoading}
            >
              {isRecsLoading ? "GERANDO..." : "[ ATUALIZAR RECOMENDAÇÕES ]"}
            </button>
          )}
        </motion.div>

        {isRecsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="bg-[#0f0f13]/40 rounded-xl p-3.5 space-y-3.5 animate-pulse border border-white/5">
                <div className="aspect-square bg-white/5 rounded-lg"></div>
                <div className="h-3 bg-white/10 rounded w-3/4"></div>
                <div className="h-2 bg-white/5 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : smartRecs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {smartRecs.map((track) => (
              <motion.div 
                key={track.id}
                className="bg-[#0f0f13]/60 hover:bg-[#16161c]/80 border border-white/5 hover:border-white/10 p-3.5 rounded-xl cursor-pointer group relative transition-all duration-350"
                onClick={() => playTrack(track, smartRecs)}
                whileHover={{ y: -4 }}
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                  <img src={track.coverUrl} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" alt={track.title} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="p-2.5 bg-neon-green text-black rounded-full scale-90 group-hover:scale-100 transition">
                      <Play size={14} fill="currentColor" />
                    </div>
                  </div>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{track.title}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{track.artist}</p>
                <span className="absolute top-2.5 right-2.5 bg-black/40 text-[8px] text-neon-green px-1.5 py-0.5 rounded border border-neon-green/10 font-bold uppercase tracking-widest font-mono">
                  Sinergia AI
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0f0f13]/30 border border-white/5 rounded-2xl p-6 text-center space-y-2">
            <p className="text-sm text-gray-400 font-light">
              Nenhuma recomendação calculada ainda. Como você ainda não escutou nenhuma música, toque um dos nossos álbuns curados abaixo para ativá-lo!
            </p>
          </div>
        )}
      </div>

      {/* 4. "TOCADOS RECENTEMENTE" (STREAM HISTORY FEED) */}
      {historyList.length > 0 && (
        <div className="space-y-4">
          <motion.div className="flex items-center gap-2" variants={itemVariants}>
            <History className="text-neon-green" size={20} />
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white">Tocados Recentemente</h3>
              <p className="text-xs text-gray-400">Histórico de reproduções em tempo real sintonizado localmente</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            {historyList.slice().reverse().slice(0, 6).map((track, i) => (
              <motion.div
                key={`${track.id}_hist_${i}`}
                className="bg-[#0f0f13]/40 border border-white/5 hover:border-white/10 rounded-xl p-3.5 hover:bg-[#14141a]/60 cursor-pointer shadow group relative transition-all"
                onClick={() => playTrack(track, historyList)}
                whileHover={{ y: -3 }}
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover transform transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <div className="p-3 bg-neon-green text-black rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform">
                      <Play size={14} fill="currentColor" />
                    </div>
                  </div>
                </div>
                <h5 className="text-xs font-bold text-white truncate">{track.title}</h5>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{track.artist}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 5. PRONTO PARA OUVIR (CURATED QUICK PLAY MIX) */}
      <div className="space-y-4">
        <motion.div className="flex items-center gap-2" variants={itemVariants}>
          <Flame className="text-neon-green" size={20} />
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white">Pronto para Ouvir</h3>
            <p className="text-xs text-gray-400">Selecione qualquer música do catálogo curado principal</p>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {ALBUM_PRESETS.flatMap(a => a.tracks).slice(0, 6).map((track, i) => (
            <motion.div 
              key={track.id}
              className="bg-[#0f0f13]/60 hover:bg-[#16161c]/80 backdrop-blur-md p-3.5 rounded-xl border border-white/5 shadow hover:shadow-lg hover:border-white/10 transition-all duration-300 group cursor-pointer"
              variants={itemVariants}
              onClick={() => playTrack(track, ALBUM_PRESETS.flatMap(a => a.tracks))}
            >
              <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <div className="p-3 bg-neon-green text-black rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform">
                    <Play size={16} fill="currentColor" />
                  </div>
                </div>
              </div>
              <h4 className="text-sm font-semibold text-white truncate max-w-full">{track.title}</h4>
              <p className="text-xs text-gray-400 truncate max-w-full mt-0.5">{track.artist}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 6. ALBUM PRESETS SECTIONS */}
      <div className="space-y-8">
        {ALBUM_PRESETS.map((album) => (
          <div key={album.id} className="space-y-4">
            <motion.div className="flex items-center justify-between" variants={itemVariants}>
              <div className="flex items-center gap-2.5">
                <TrendingUp className="text-neon-green" size={20} />
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-white">{album.name}</h3>
                  <p className="text-xs text-gray-400">{album.description}</p>
                </div>
              </div>
              <button 
                onClick={() => changeTab("playlist", album)}
                className="text-xs font-semibold text-neon-green hover:underline hover:text-white transition"
              >
                Ver tudo
              </button>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {album.tracks.slice(0, 4).map((track) => (
                <div 
                  key={track.id}
                  onClick={() => playTrack(track, album.tracks)}
                  className="bg-[#0f0f13]/40 border border-white/5 hover:border-white/10 rounded-xl p-3.5 hover:bg-[#14141a]/60 cursor-pointer shadow group relative transition-all"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                    <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover transform transition-transform group-hover:scale-105" />
                    <div className="absolute bottom-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition">
                      <Play size={14} fill="currentColor" className="text-neon-green" />
                    </div>
                  </div>
                  <h5 className="text-xs font-bold text-white truncate">{track.title}</h5>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{track.artist}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 7. DYNAMIC STATISTICS ANALYTICS SECTION */}
      <motion.div 
        className="bg-gradient-to-r from-neon-green/5 via-[#0e0e13]/60 to-black/40 border border-neon-green/10 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
        variants={itemVariants}
      >
        <div className="space-y-2">
          <h4 className="text-lg font-bold text-white flex items-center gap-1.5">
            <Award className="text-neon-green" size={20} />
            Seu Perfil de Música Premium
          </h4>
          <p className="text-xs text-gray-400 font-light max-w-lg">
            Acompanhe seu hábito sonoro em tempo real. Cada play atualiza as métricas locais seguras de forma totalmente integrada e offline.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 md:gap-8 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
          <div className="text-center md:text-left">
            <span className="block text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Top Artista</span>
            <span className="text-sm md:text-base font-bold text-neon-green truncate max-w-[120px] block">{profileAffinity.topArtist}</span>
          </div>
          <div className="text-center md:text-left">
            <span className="block text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Músicas</span>
            <span className="text-xl md:text-2xl font-bold text-white">{stats?.songsListened || 0}</span>
          </div>
          <div className="text-center md:text-left">
            <span className="block text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Minutos</span>
            <span className="text-xl md:text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-1">
              <Clock size={16} className="text-neon-green/80" />
              {stats?.minutesListened || 0}
            </span>
          </div>
          <div className="text-center md:text-left">
            <span className="block text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Favoritas</span>
            <span className="text-xl md:text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-1">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              {favorites.length}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

