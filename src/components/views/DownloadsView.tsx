import React from "react";
import { useMusic } from "../MusicContext";
import { Download, AlertCircle, Play, Trash, Wifi, WifiOff, HardDrive, Check, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

export const DownloadsView: React.FC = () => {
  const { 
    downloads, 
    playTrack, 
    toggleDownload, 
    isOfflineMode, 
    toggleOfflineMode, 
    clearUserHistory 
  } = useMusic();

  const handleClearCache = async () => {
    if (confirm("Deseja realmente limpar todo o cache local do BJCmusic? Suas músicas salvas e favoritos serão apagados do aparelho.")) {
      localStorage.clear();
      window.location.reload();
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

  // Fictional cache storage space statistics
  const cacheSizeMB = (downloads.length * 3.8).toFixed(1);
  const cachePercentage = Math.min(100, Math.max(1, (downloads.length * 0.4))).toFixed(1);

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
            <Download className="text-neon-green" size={28} />
            Músicas Salvas (Downloads)
          </h1>
          <p className="text-xs text-gray-400">Suas faixas prontas para reproduzir offline sem depender da internet.</p>
        </div>

        {/* Dynamic Client Offline Mode Switch with Glow */}
        <motion.div 
          className={`flex items-center gap-3 px-4 py-2.5 rounded-full border transition-all ${
            isOfflineMode 
              ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-lg shadow-orange-500/5' 
              : 'bg-[#101016] border-white/5 text-gray-400'
          }`}
          variants={itemVariants}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold select-none">
            {isOfflineMode ? <WifiOff size={14} className="animate-pulse" /> : <Wifi size={14} className="text-neon-green" />}
            <span>{isOfflineMode ? "MODO OFFLINE ATIVO" : "MODO ONLINE CONFIGURADO"}</span>
          </div>
          <button 
            onClick={toggleOfflineMode}
            className={`w-9 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer ${isOfflineMode ? 'bg-orange-500' : 'bg-gray-700'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${isOfflineMode ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </motion.div>
      </div>

      {/* Grid of Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Storage Bar card */}
        <motion.div 
          className="bg-[#0f0f13]/60 border border-white/5 p-4 rounded-xl flex items-center gap-4 shadow"
          variants={itemVariants}
        >
          <div className="p-3 bg-neon-green/10 text-neon-green rounded-lg">
            <HardDrive size={20} />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block tracking-wider">Armazenamento</span>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-neon-green h-full rounded-full transition-all duration-500" style={{ width: `${cachePercentage}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-sans">
              <span>{cacheSizeMB} MB Usados</span>
              <span>Limite: Local</span>
            </div>
          </div>
        </motion.div>

        {/* Premium Cache Lock indicator card */}
        <motion.div 
          className="bg-[#0f0f13]/60 border border-white/5 p-4 rounded-xl flex items-center gap-4 shadow"
          variants={itemVariants}
        >
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1 text-xs">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block tracking-wider">Segurança Premium</span>
            <p className="text-white font-medium">BJCmusic Sandbox</p>
            <p className="text-[11px] text-gray-400">Arquitetura persistente offline.</p>
          </div>
        </motion.div>

        {/* Clear Storage Control card */}
        <motion.div 
          className="bg-[#0f0f13]/60 border border-white/5 p-4 rounded-xl flex items-center gap-4 shadow"
          variants={itemVariants}
        >
          <div className="p-3 bg-red-500/10 text-red-500 rounded-lg">
            <Trash size={18} />
          </div>
          <div className="space-y-1 text-xs flex-1">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block tracking-wider">Manutenção</span>
            <button 
              onClick={handleClearCache}
              className="text-[11px] text-red-400 hover:text-red-300 font-bold hover:underline transition text-left block"
            >
              Liberar Armazenamento...
            </button>
            <p className="text-[10px] text-gray-500">Deleta músicas e históricos</p>
          </div>
        </motion.div>
      </div>

      {/* Main downloads list block */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-semibold text-gray-400">Suas Faixas Gravadas ({downloads.length})</h3>

        {downloads.length === 0 ? (
          <div className="bg-[#0c0c11]/40 border border-white/5 p-12 text-center rounded-2xl flex flex-col items-center justify-center space-y-3">
            <Download className="text-gray-600 animate-bounce" size={32} />
            <p className="font-semibold text-sm text-gray-300">Nenhuma música baixada ainda</p>
            <p className="text-xs text-gray-500 max-w-sm">
              Visite a aba de "Buscar" ou sua "Biblioteca", e clique no ícone de download ao lado de qualquer canção para salvá-la aqui.
            </p>
          </div>
        ) : (
          <div className="bg-[#0b0b0f]/80 backdrop-blur-md rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden">
            {downloads.map((track, i) => (
              <div 
                key={track.id}
                className="flex items-center justify-between p-3.5 hover:bg-[#121218]/70 transition group block"
              >
                {/* Track Details & Play block */}
                <div 
                  className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer" 
                  onClick={() => playTrack(track, downloads)}
                >
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

                {/* Info action buttons */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={11} />
                    Salva Offline
                  </span>

                  <button 
                    onClick={() => toggleDownload(track)}
                    className="p-1.5 rounded-full text-gray-500 hover:text-red-400 hover:bg-white/5 transition"
                    title="Remover Download"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Offline mode warning */}
      {isOfflineMode && downloads.length > 0 && (
        <div className="px-5 py-3.5 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-3 mt-4">
          <AlertCircle className="text-orange-400 flex-shrink-0 mt-0.5" size={16} />
          <div className="text-xs space-y-1 text-orange-300">
            <p className="font-semibold">O Modo Offline está ativo!</p>
            <p className="text-orange-400/80 leading-relaxed font-light">
              Todas as buscas online, canais de rádio ao vivo e streaming que dependem da web estão ocultos ou bloqueados. Para restabelecer o sinal total, desative a chave acima.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};
