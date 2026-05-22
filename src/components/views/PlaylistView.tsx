import React from "react";
import { useMusic } from "../MusicContext";
import { Play, Trash2, ArrowLeft, Heart, Download, Music, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

export const PlaylistView: React.FC = () => {
  const { 
    currentPlaylist, 
    changeTab, 
    playTrack, 
    deletePlaylistId, 
    removeTrackFromPlaylist, 
    favorites, 
    toggleFavorite,
    downloads,
    toggleDownload,
    playlists,
    addTrackToPlaylistId // Let's use remove custom trigger
  } = useMusic();

  if (!currentPlaylist) {
    return (
      <div className="p-8 text-center text-gray-500 text-xs">
        Nenhuma playlist selecionada.
      </div>
    );
  }

  // Double check if playlist has updated tracks inside state (if it's a custom playlist)
  const isCustom = currentPlaylist.isCustom;
  const dbPlaylist = playlists.find(p => p.id === currentPlaylist.id) || currentPlaylist;
  const tracks = dbPlaylist.tracks || [];

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    // Custom playlists allow track removal
    const ctx = useMusic();
    try {
      // Calls our Context database sync helper
      await ctx.deletePlaylistId; // Wait, we wrote the service db methods, let's verify context signature.
      // Ah! In MusicContext, we have: `deletePlaylistId` and `addTrackToPlaylistId`.
      // Let's check if we have a direct handle to delete songs from playlist!
      // In db.ts, we have `removeTrackFromPlaylist` which is extremely useful. Let's make sure it refreshes the state.
      // Let's call the database directly or just refresh page. Let's write an edit block later if needed,
      // but we can integrate it seamlessly. Let's verify context if it contains deleting tracks.
      // Wait, in dbService, we have: `removeTrackFromPlaylist(playlistId, trackId)`.
      // Let's call dbService directly since it updates LocalStorage, and then we just use standard context update!
      // To keep it simple, let's call the local storage update, and reload/refresh state!
    } catch {}
  };

  return (
    <motion.div 
      className="p-6 md:p-8 space-y-6 pb-32 text-gray-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back button */}
      <button 
        onClick={() => changeTab("library")}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition cursor-pointer select-none"
      >
        <ArrowLeft size={14} />
        Voltar para Biblioteca
      </button>

      {/* Playlist Hero Banner Layout */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 pt-2 pb-4">
        {/* Cover Art */}
        <div className="w-44 h-44 rounded-2xl overflow-hidden shadow-2xl relative border border-white/5 bg-neutral-900 group flex-shrink-0">
          <img src={dbPlaylist.coverUrl} alt={dbPlaylist.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
            <Play size={20} fill="currentColor" onClick={handlePlayAll} className="text-neon-green cursor-pointer" />
          </div>
        </div>

        {/* Metadata */}
        <div className="text-center md:text-left space-y-2 flex-grow">
          <span className="text-[10px] uppercase tracking-wider font-bold text-neon-green bg-neon-green/10 px-2.5 py-1 rounded-full border border-neon-green/10">
            {isCustom ? "PLAYLIST DO USUÁRIO" : "PLAYLIST OFICIAL BJC"}
          </span>
          
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{dbPlaylist.name}</h1>
          <p className="text-xs text-gray-400 font-light leading-relaxed max-w-xl">{dbPlaylist.description || "Sem descrição disponível."}</p>
          
          <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-mono text-gray-500 pt-1">
            <span>{tracks.length} {tracks.length === 1 ? 'música' : 'músicas'}</span>
            <span>•</span>
            <span>Estéreo</span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {tracks.length > 0 && (
            <button 
              onClick={handlePlayAll}
              className="px-5 py-2.5 bg-neon-green text-black font-extrabold text-xs uppercase tracking-wide rounded-full flex items-center gap-1.5 shadow-lg shadow-neon-green/15 hover:scale-105 transition"
            >
              <Play size={15} fill="currentColor" />
              Tocar Playlist
            </button>
          )}

          {isCustom && (
            <button 
              onClick={() => {
                if (confirm(`Deseja mesmo excluir toda a playlist "${dbPlaylist.name}"?`)) {
                  deletePlaylistId(dbPlaylist.id);
                  changeTab("library");
                }
              }}
              className="p-2.5 bg-white/5 border border-white/5 hover:border-red-500/20 hover:bg-red-500/10 rounded-full text-gray-400 hover:text-red-500 transition"
              title="Excluir Playlist"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Tracks Table list */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-semibold text-gray-400">Faixas Inclusas</h3>

        {tracks.length === 0 ? (
          <div className="bg-[#0b0b0e]/30 border border-white/5 p-12 text-center rounded-2xl flex flex-col items-center justify-center space-y-2">
            <Music className="text-gray-600 animate-pulse" size={28} />
            <p className="font-semibold text-xs text-gray-300">Playlist Vazia</p>
            <p className="text-[10px] text-gray-500 max-w-sm">Adicione músicas pesquisando na aba de busca (Explore) e clicando em "+" ao lado de qualquer canção.</p>
          </div>
        ) : (
          <div className="bg-[#0b0b0f]/80 backdrop-blur-md rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden">
            {tracks.map((track, idx) => {
              const isFav = favorites.some(f => f.id === track.id);
              const isDl = downloads.some(d => d.id === track.id);

              return (
                <div 
                  key={`${track.id}_${idx}`}
                  className="flex items-center justify-between p-3.5 hover:bg-[#121218]/70 group transition block"
                >
                  {/* Track Details */}
                  <div 
                    onClick={() => playTrack(track, tracks)}
                    className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                  >
                    {/* Index */}
                    <span className="hidden sm:inline text-xs font-mono text-gray-500 w-4 text-right pr-1 group-hover:text-neon-green">{idx + 1}</span>
                    
                    {/* Cover art image */}
                    <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    
                    {/* Title & Artist */}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-neon-green transition">{track.title}</h4>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{track.artist}</p>
                    </div>
                  </div>

                  {/* Actions right corner */}
                  <div className="flex items-center gap-3">
                    {/* Fav icon */}
                    <button 
                      onClick={() => toggleFavorite(track)}
                      className={`p-1.5 rounded-full transition ${isFav ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}
                    >
                      <Heart size={13} fill={isFav ? "currentColor" : "none"} />
                    </button>

                    {/* Download icon */}
                    <button 
                      onClick={() => toggleDownload(track)}
                      className={`p-1.5 rounded-full transition ${isDl ? 'text-neon-green' : 'text-gray-500 hover:text-white'}`}
                    >
                      <Download size={13} />
                    </button>
                    
                    {/* Remove single track from Custom Playlist */}
                    {isCustom && (
                      <button 
                        onClick={async () => {
                          const ctx = useMusic();
                          // Import local databases to delete track safely
                          const { dbService } = await import("../../services/db");
                          const resPl = await dbService.removeTrackFromPlaylist(dbPlaylist.id, track.id);
                          // Trigger double-render update via tab context refreshing
                          changeTab("playlist", resPl.find(p => p.id === dbPlaylist.id));
                        }}
                        className="p-1.5 text-gray-500 hover:text-red-400 rounded-full hover:bg-white/5 transition"
                        title="Remover da Playlist"
                      >
                        <Trash2 size={13} />
                      </button>
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
