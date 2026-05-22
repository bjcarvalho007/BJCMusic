import React, { useState } from "react";
import { useMusic } from "../MusicContext";
import { Track } from "../../types";
import { ListMusic, Heart, History, Trash, Play, Plus, Trash2, FolderHeart, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const LibraryView: React.FC = () => {
  const { 
    playlists, 
    favorites, 
    historyList, 
    createNewPlaylist, 
    deletePlaylistId, 
    playTrack, 
    changeTab, 
    clearUserHistory 
  } = useMusic();

  const [plName, setPlName] = useState("");
  const [plDesc, setPlDesc] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (plName.trim()) {
      await createNewPlaylist(plName, plDesc);
      setPlName("");
      setPlDesc("");
      setShowAddModal(false);
    }
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
      className="p-6 md:p-8 space-y-8 pb-32 text-gray-200"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight flex items-center gap-2">
            <FolderHeart className="text-neon-green" size={28} />
            Sua Biblioteca
          </h1>
          <p className="text-xs text-gray-400">Suas coleções integradas, favoritos e estatísticas locais.</p>
        </div>

        {/* Modal Toggle creation button */}
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-neon-green hover:bg-emerald-400 animate-pulse transition text-black font-semibold text-xs rounded-full flex items-center gap-1.5 shadow-md hover:shadow-neon-green/20"
        >
          <Plus size={14} />
          Nova Playlist
        </button>
      </div>

      {/* Grid of Playlists */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-1.5">
          <ListMusic size={16} className="text-neon-green" />
          Playlists Personalizadas ({playlists.length})
        </h3>

        {playlists.length === 0 ? (
          <div className="bg-[#0c0c11]/40 border border-white/5 p-8 text-center rounded-2xl flex flex-col items-center justify-center space-y-2">
            <ListMusic className="text-gray-600" size={24} />
            <p className="font-semibold text-xs text-gray-300">Crie sua primeira playlist</p>
            <p className="text-[10px] text-gray-500 max-w-xs">Organize suas faixas e crie seu mix ideal. Clique em "Nova Playlist" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {playlists.map((pl) => (
              <motion.div 
                key={pl.id}
                onClick={() => changeTab("playlist", pl)}
                className="bg-[#0f0f13]/60 hover:bg-[#15151c]/90 border border-white/5 hover:border-neon-green/10 p-3.5 rounded-xl cursor-pointer group shadow relative transition-all"
                variants={itemVariants}
                whileHover={{ y: -3 }}
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                  <img src={pl.coverUrl} alt={pl.name} className="w-full h-full object-cover transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Play size={16} fill="currentColor" className="text-neon-green" />
                  </div>
                </div>

                <h4 className="text-xs font-bold text-white truncate">{pl.name}</h4>
                <p className="text-[10px] text-gray-400 truncate mt-0.5 font-light">{pl.tracks.length} {pl.tracks.length === 1 ? 'música' : 'músicas'}</p>
                
                {/* Delete button option */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Excluir playlist "${pl.name}"?`)) {
                      deletePlaylistId(pl.id);
                    }
                  }}
                  className="absolute top-2.5 right-2.5 p-1.5 bg-black/75 rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition duration-200"
                  title="Excluir Playlist"
                >
                  <Trash size={12} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Grid containing Favourites list on Left, History List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
        
        {/* FAVORITES COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-1.5">
              <Heart size={15} fill="currentColor" className="text-red-500 animate-pulse" />
              Favoritas ({favorites.length})
            </h3>
            {favorites.length > 0 && (
              <button 
                onClick={() => playTrack(favorites[0], favorites)}
                className="text-xs text-neon-green hover:underline cursor-pointer"
              >
                Tocar Tudo
              </button>
            )}
          </div>

          {favorites.length === 0 ? (
            <div className="bg-[#0c0c11]/30 border border-white/5 p-8 text-center rounded-xl text-gray-500 text-xs">
              Músicas favoritas aparecerão aqui.
            </div>
          ) : (
            <div className="bg-[#0b0b0f]/80 backdrop-blur-md border border-white/5 rounded-2xl divide-y divide-white/5 max-h-80 overflow-y-auto no-scrollbar">
              {favorites.map((track) => (
                <div 
                  key={track.id}
                  onClick={() => playTrack(track, favorites)}
                  className="flex items-center justify-between p-3.5 hover:bg-[#121218]/50 cursor-pointer group transition block"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={track.coverUrl} alt={track.title} className="w-9 h-9 rounded object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate group-hover:text-neon-green transition">{track.title}</h4>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{track.artist}</p>
                    </div>
                  </div>
                  <Play size={12} fill="currentColor" className="text-neon-green opacity-0 group-hover:opacity-100 transition mr-2" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LISTENING HISTORY COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-1.5">
              <History size={15} className="text-neon-green" />
              Recentes / Histórico ({historyList.length})
            </h3>
            {historyList.length > 0 && (
              <button 
                onClick={clearUserHistory}
                className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1"
                title="Limpar Histórico"
              >
                <Trash2 size={12} />
                Limpar
              </button>
            )}
          </div>

          {historyList.length === 0 ? (
            <div className="bg-[#0c0c11]/30 border border-white/5 p-8 text-center rounded-xl text-gray-500 text-xs text-light">
              Nenhuma canção escutada recentemente.
            </div>
          ) : (
            <div className="bg-[#0b0b0f]/80 backdrop-blur-md border border-white/5 rounded-2xl divide-y divide-white/5 max-h-80 overflow-y-auto no-scrollbar">
              {historyList.map((track, i) => (
                <div 
                  key={`${track.id}_${i}`}
                  onClick={() => playTrack(track)}
                  className="flex items-center justify-between p-3.5 hover:bg-[#121218]/50 cursor-pointer group transition block"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={track.coverUrl} alt={track.title} className="w-9 h-9 rounded object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate group-hover:text-neon-green transition">{track.title}</h4>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{track.artist}</p>
                    </div>
                  </div>
                  <Play size={12} fill="currentColor" className="text-neon-green opacity-0 group-hover:opacity-100 transition mr-2" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE PLAYLIST POPUP MODAL OVERLAY */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
            />
            
            <motion.div 
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-[#0f0f14] border border-white/10 p-6 rounded-2xl shadow-2xl z-50 space-y-4"
              initial={{ scale: 0.9, opacity: 0, x: "-50%", y: "-40%" }}
              animate={{ scale: 1, opacity: 1, x: "-50%", y: "-50%" }}
              exit={{ scale: 0.9, opacity: 0, x: "-50%", y: "-40%" }}
              transition={{ type: "spring", duration: 0.4 }}
            >
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white tracking-tight">Nova Playlist Personalizada</h3>
                <p className="text-xs text-gray-400">Dê asas às suas vibrações criando uma coletânea local.</p>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Título da playlist</label>
                  <input 
                    type="text" 
                    value={plName}
                    onChange={(e) => setPlName(e.target.value)}
                    required
                    placeholder="Ex: Vibes da Madrugada, Treino Foco..."
                    className="w-full px-4 py-2.5 bg-black/60 text-sm rounded-lg border border-white/10 text-white focus:outline-none focus:border-neon-green"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Descrição (Opcional)</label>
                  <textarea 
                    value={plDesc}
                    onChange={(e) => setPlDesc(e.target.value)}
                    rows={2}
                    placeholder="Coleção especial de grooves suaves..."
                    className="w-full px-4 py-2.5 bg-black/60 text-sm rounded-lg border border-white/10 text-white focus:outline-none focus:border-neon-green resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-full transition"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-neon-green hover:bg-emerald-400 text-black text-xs font-bold rounded-full transition shadow-lg shadow-neon-green/15"
                  >
                    Confirmar Criação
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
