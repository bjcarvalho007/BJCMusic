import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Track, Playlist, UserStats } from "../types";
import { dbService } from "../services/db";

interface MusicContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number; // in seconds
  duration: number; // in seconds
  volume: number; // 0 to 1
  speed: number; // 0.5 to 2
  queue: Track[];
  historyList: Track[];
  favorites: Track[];
  playlists: Playlist[];
  downloads: Track[];
  stats: UserStats | null;
  activeTab: string;
  currentPlaylist: Playlist | null;
  selectedArtist: string | null;
  lyrics: string;
  isLyricsLoading: boolean;
  searchTerm: string;
  isSearchLoading: boolean;
  searchResults: Track[];
  radioGenre: string;
  radioStations: Track[];
  isRadioLoading: boolean;
  smartRecs: Track[];
  isRecsLoading: boolean;
  isOfflineMode: boolean;
  // Controllers
  changeTab: (tab: string, meta?: any) => void;
  playTrack: (track: Track, tracksContext?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolumeLevel: (lvl: number) => void;
  setPlaybackSpeed: (val: number) => void;
  searchSongs: (q: string) => Promise<void>;
  fetchRadioStations: (genre: string) => Promise<void>;
  toggleFavorite: (track: Track) => Promise<void>;
  toggleDownload: (track: Track) => Promise<void>;
  createNewPlaylist: (name: string, desc?: string) => Promise<void>;
  addTrackToPlaylistId: (playlistId: string, track: Track) => Promise<void>;
  deletePlaylistId: (playlistId: string) => Promise<void>;
  loadRecommendations: () => Promise<void>;
  clearUserHistory: () => Promise<void>;
  toggleOfflineMode: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

// YT Player global check
declare global {
  interface Window {
    onYouTubeIframeAPIReady: (() => void) | undefined;
    YT: any;
  }
}

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Hierarchy State
  const [activeTab, setActiveTab] = useState<string>("home");
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  // Music Player Core State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [speed, setSpeed] = useState<number>(1.0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [historyList, setHistoryList] = useState<Track[]>([]);

  // Db-persisted State
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [downloads, setDownloads] = useState<Track[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);

  // Search, Radio, Smart Recs
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  
  const [radioGenre, setRadioGenre] = useState<string>("lofi");
  const [radioStations, setRadioStations] = useState<Track[]>([]);
  const [isRadioLoading, setIsRadioLoading] = useState<boolean>(false);

  const [smartRecs, setSmartRecs] = useState<Track[]>([]);
  const [isRecsLoading, setIsRecsLoading] = useState<boolean>(false);

  const [lyrics, setLyrics] = useState<string>("");
  const [isLyricsLoading, setIsLyricsLoading] = useState<boolean>(false);
  
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  // References for Player HTML modules
  const ytPlayerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isVideoLoadingRef = useRef<boolean>(false);

  // Loading initial data
  useEffect(() => {
    async function loadData() {
      const favs = await dbService.getFavorites();
      const pls = await dbService.getPlaylists();
      const dls = await dbService.getDownloads();
      const hist = await dbService.getHistory();
      const computedStats = await dbService.getStats();

      setFavorites(favs);
      setPlaylists(pls);
      setDownloads(dls);
      setHistoryList(hist);
      setStats(computedStats);
    }
    loadData();
  }, []);

  // Sync volume state and progress intervals
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Load the YouTube API dynamically on mounts
  useEffect(() => {
    // Standard HTML Audio for radio streams
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));
    audio.addEventListener("durationchange", () => {
      setDuration(audio.duration || 0);
    });
    audio.addEventListener("timeupdate", () => {
      setProgress(audio.currentTime || 0);
    });
    audio.addEventListener("ended", () => {
      nextTrack();
    });

    // YouTube setup helper
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Set up global player callback with progressive retry to bind to React DOM target
    const initPlayer = () => {
      const target = document.getElementById("bjcmusic-yt-player-target");
      if (!target) {
        setTimeout(initPlayer, 150);
        return;
      }

      try {
        ytPlayerRef.current = new window.YT.Player("bjcmusic-yt-player-target", {
          height: "100%",
          width: "100%",
          videoId: "jfKfPfyJRdk", // starting neutral lofi video
          playerVars: {
            autoplay: 0,
            controls: 1, // Let users interact directly to bypass strict browser autoplay limits
            disablekb: 1,
            fs: 1,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin,
            playsinline: 1,
          },
          events: {
            onReady: () => {
              console.log("YouTube Video Terminal player ready.");
              if (ytPlayerRef.current) {
                ytPlayerRef.current.setVolume(volume * 100);
              }
            },
            onStateChange: (event: any) => {
              // 1 = Playing, 2 = Paused, 0 = Ended
              if (event.data === 1) {
                setIsPlaying(true);
                const dur = ytPlayerRef.current.getDuration() || 0;
                setDuration(dur);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                nextTrack();
              }
            },
          },
        });
      } catch (err) {
        console.error("Failed to construct YouTube player:", err);
      }
    };

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    // If script is already compiled ready
    if (window.YT && window.YT.Player) {
      initPlayer();
    }

    // Progress poller for Youtube and direct HTML5 audio playbacks
    const interval = setInterval(() => {
      if (currentTrack && currentTrack.type === "song") {
        if (currentTrack.audioUrl && audioRef.current) {
          setProgress(audioRef.current.currentTime || 0);
        } else if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
          try {
            const state = ytPlayerRef.current.getPlayerState();
            if (state === 1) { // Playing
              setProgress(ytPlayerRef.current.getCurrentTime() || 0);
            }
          } catch {}
        }
      }
    }, 500);

    return () => {
      clearInterval(interval);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [currentTrack]);

  // Navigate tabs helper
  const changeTab = (tab: string, meta?: any) => {
    setActiveTab(tab);
    if (tab === "playlist" && meta) {
      setCurrentPlaylist(meta);
    } else if (tab === "artist" && meta) {
      setSelectedArtist(meta);
    }
  };

  // Resolve YouTube ID and play safely
  const playTrack = async (track: Track, tracksContext?: Track[]) => {
    if (isOfflineMode && !track.isOffline) {
      alert("Essa música não está disponível no modo Offline. Ative seu sinal ou baixe-a primeiro!");
      return;
    }

    // Stop current playbacks
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
      try {
        ytPlayerRef.current.pauseVideo();
      } catch {}
    }

    setIsPlaying(false);
    setProgress(0);
    setDuration(track.duration || 0);
    setCurrentTrack(track);

    // Save playing context queue
    if (tracksContext && tracksContext.length > 0) {
      // Standard: find index and rearrange queue starting from next track
      const idx = tracksContext.findIndex((t) => t.id === track.id);
      if (idx !== -1) {
        setQueue(tracksContext.slice(idx + 1));
      } else {
        setQueue(tracksContext);
      }
    }

    // Save Track Listen Entry
    const updatedHistory = await dbService.addHistoryEntry(track);
    setHistoryList(updatedHistory);
    const updatedStats = await dbService.getStats();
    setStats(updatedStats);

    // Fetch Lyrics immediately
    fetchLyrics(track);

    // Load recommendations dynamically
    fetchRecommendations(track);

    if (track.type === "radio") {
      // Live Radio Stream
      if (audioRef.current && track.radioUrl) {
        try {
          audioRef.current.src = track.radioUrl;
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (e) {
          console.error("Live streaming failed:", e);
          alert("Não foi possível carregar esta rádio ao vivo. Tente outro canal!");
        }
      }
    } else {
      // YouTube / Cached MP3 streaming (with direct audioUrl resilient fallback)
      let resolvedAudioUrl = track.audioUrl;
      if (!resolvedAudioUrl) {
        try {
          const res = await fetch(`/api/resolve-audio?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`);
          const data = await res.json();
          if (data.audioUrl) {
            resolvedAudioUrl = data.audioUrl;
            track.audioUrl = resolvedAudioUrl; // save on track
          }
        } catch (err) {
          console.error("Failed to dynamically resolve resilient audio:", err);
        }
      }

      // Play resilient high-fidelity audio stream first
      if (resolvedAudioUrl && audioRef.current) {
        try {
          audioRef.current.src = resolvedAudioUrl;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              setIsPlaying(true);
            }).catch(playErr => {
              console.warn("Direct HTML5 audio blocked initially, waiting for user click action:", playErr);
            });
          }
        } catch (audioErr) {
          console.error("HTML5 direct reproduction error:", audioErr);
        }
      }

      // Concurrently resolve video ID
      let ytId = track.youtubeId;
      if (!ytId) {
        isVideoLoadingRef.current = true;
        try {
          const res = await fetch(`/api/yt-resolve?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`);
          const data = await res.json();
          if (data.youtubeId) {
            ytId = data.youtubeId;
            track.youtubeId = ytId;
          }
        } catch (err) {
          console.error("Failed to resolve Video ID, defaulting mock beat", err);
          ytId = "jfKfPfyJRdk";
        }
        isVideoLoadingRef.current = false;
      }

      // Sync concealed video terminal player
      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
        try {
          ytPlayerRef.current.loadVideoById(ytId);
          if (resolvedAudioUrl) {
            // Mute background visual YouTube video to avoid redundant duplicate audio echo
            ytPlayerRef.current.mute();
          } else {
            ytPlayerRef.current.unMute();
            ytPlayerRef.current.setVolume(volume * 100);
          }
          ytPlayerRef.current.playVideo();
          ytPlayerRef.current.setPlaybackRate(speed);
          
          if (!resolvedAudioUrl) {
            setIsPlaying(true);
          }
        } catch (err) {
          console.error("Concealed background video play error", err);
        }
      }
    }
  };

  // Toggle Pause Play
  const togglePlay = () => {
    if (!currentTrack) return;

    const hasAudioElement = currentTrack.type === "radio" || currentTrack.audioUrl;

    if (hasAudioElement && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }

    // Simultaneously toggle state on visual Video player
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
      try {
        const pState = ytPlayerRef.current.getPlayerState();
        if (isPlaying) {
          ytPlayerRef.current.pauseVideo();
          if (!hasAudioElement) {
            setIsPlaying(false);
          }
        } else {
          ytPlayerRef.current.playVideo();
          if (!hasAudioElement) {
            setIsPlaying(true);
          }
        }
      } catch {}
    }
  };

  // Play Next Song in Queue
  const nextTrack = () => {
    if (queue.length > 0) {
      const next = queue[0];
      const remaining = queue.slice(1);
      setQueue(remaining);
      playTrack(next);
    } else {
      // Loop or restart currently playing track
      if (currentTrack) {
        seekTo(0);
      }
    }
  };

  // Play Previous (or restart time tracker)
  const prevTrack = () => {
    if (progress > 5) {
      seekTo(0);
    } else if (historyList.length > 1) {
      // History index 0 is current track, index 1 is previous track
      const prev = historyList[1];
      playTrack(prev);
    }
  };

  // Seek Progress
  const seekTo = (seconds: number) => {
    if (!currentTrack) return;
    if (currentTrack.type === "radio") return; // cannot seek live stream

    if (currentTrack.audioUrl && audioRef.current) {
      try {
        audioRef.current.currentTime = seconds;
        setProgress(seconds);
      } catch (e) {
        console.error("Seek error in HTML5 Audio:", e);
      }
    }

    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      try {
        ytPlayerRef.current.seekTo(seconds, true);
        if (!currentTrack.audioUrl) {
          setProgress(seconds);
        }
      } catch {}
    }
  };

  // Set Speed
  const setPlaybackSpeed = (val: number) => {
    setSpeed(val);
    if (audioRef.current) {
      try {
        audioRef.current.playbackRate = val;
      } catch {}
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackRate === "function") {
      try {
        ytPlayerRef.current.setPlaybackRate(val);
      } catch {}
    }
  };

  // Volume setup 
  const setVolumeLevel = (lvl: number) => {
    setVolume(lvl);
    if (audioRef.current) {
      try {
        audioRef.current.volume = lvl;
      } catch {}
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === "function") {
      try {
        ytPlayerRef.current.setVolume(lvl * 100);
      } catch {}
    }
  };

  // Search Deezer API
  const searchSongs = async (q: string) => {
    setSearchTerm(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const body = await res.json();
      setSearchResults(body.data || []);
    } catch {
      console.error("Problems searching tracks.");
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Fetch online Radio stations
  const fetchRadioStations = async (genre: string) => {
    setRadioGenre(genre);
    setIsRadioLoading(true);
    try {
      const res = await fetch(`/api/radios?genre=${encodeURIComponent(genre)}`);
      const json = await res.json();
      setRadioStations(json.data || []);
    } catch (e) {
      console.error("Error loaded radios:", e);
    } finally {
      setIsRadioLoading(false);
    }
  };

  // Gemini Synced Lyrics generators
  const fetchLyrics = async (track: Track) => {
    if (track.type === "radio") {
      setLyrics("BJCmusic Transmissão ao vivo - Canal de Rádio");
      return;
    }
    setIsLyricsLoading(true);
    try {
      const response = await fetch("/api/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: track.title, artist: track.artist }),
      });
      const data = await response.json();
      setLyrics(data.lyrics || "Letras indisponíveis.");
    } catch {
      setLyrics("Erro ao conectar ao BJCmusic Lyrics Cloud.");
    } finally {
      setIsLyricsLoading(false);
    }
  };

  // Gemini Smart Recommendations
  const fetchRecommendations = async (track: Track) => {
    setIsRecsLoading(true);
    try {
      const recent = historyList.slice(0, 5);
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: track.title, artist: track.artist, recentTracks: recent }),
      });
      const data = await response.json();
      setSmartRecs(data.data || []);
    } catch (e) {
      console.error("Recs load failed", e);
    } finally {
      setIsRecsLoading(false);
    }
  };

  // Toggle favorite persistent helper
  const toggleFavorite = async (track: Track) => {
    const isFav = favorites.some((t) => t.id === track.id);
    let updated;
    if (isFav) {
      updated = await dbService.removeFavorite(track.id);
    } else {
      updated = await dbService.addFavorite(track);
    }
    setFavorites(updated);
    
    // Sync active playing status tags
    if (currentTrack && currentTrack.id === track.id) {
      setCurrentTrack({ ...currentTrack, isFavorite: !isFav });
    }
  };

  // Toggle simulated offline download cache helper
  const toggleDownload = async (track: Track) => {
    const isDownloaded = downloads.some((t) => t.id === track.id);
    let updated;
    if (isDownloaded) {
      updated = await dbService.removeDownload(track.id);
    } else {
      updated = await dbService.addDownload(track);
    }
    setDownloads(updated);

    if (currentTrack && currentTrack.id === track.id) {
      setCurrentTrack({ ...currentTrack, isOffline: !isDownloaded });
    }
  };

  // Custom User Playlists
  const createNewPlaylist = async (name: string, desc: string = "") => {
    const updated = await dbService.createPlaylist(name, desc);
    setPlaylists(updated);
  };

  const addTrackToPlaylistId = async (playlistId: string, track: Track) => {
    const updated = await dbService.addTrackToPlaylist(playlistId, track);
    setPlaylists(updated);
    // update current rendering playlist if active
    if (currentPlaylist && currentPlaylist.id === playlistId) {
      const updatedPlaylist = updated.find((p) => p.id === playlistId) || null;
      setCurrentPlaylist(updatedPlaylist);
    }
  };

  const deletePlaylistId = async (playlistId: string) => {
    const updated = await dbService.deletePlaylist(playlistId);
    setPlaylists(updated);
    if (currentPlaylist && currentPlaylist.id === playlistId) {
      setActiveTab("home");
      setCurrentPlaylist(null);
    }
  };

  // Queue and history
  const loadRecommendations = async () => {
    if (currentTrack) {
      await fetchRecommendations(currentTrack);
    }
  };

  const clearUserHistory = async () => {
    await dbService.clearHistory();
    setHistoryList([]);
    const updatedStats = await dbService.getStats();
    setStats(updatedStats);
  };

  const toggleOfflineMode = () => {
    setIsOfflineMode(!isOfflineMode);
  };

  return (
    <MusicContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        duration,
        volume,
        speed,
        queue,
        historyList,
        favorites,
        playlists,
        downloads,
        stats,
        activeTab,
        currentPlaylist,
        selectedArtist,
        lyrics,
        isLyricsLoading,
        searchTerm,
        isSearchLoading,
        searchResults,
        radioGenre,
        radioStations,
        isRadioLoading,
        smartRecs,
        isRecsLoading,
        isOfflineMode,
        changeTab,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        setVolumeLevel,
        setPlaybackSpeed,
        searchSongs,
        fetchRadioStations,
        toggleFavorite,
        toggleDownload,
        createNewPlaylist,
        addTrackToPlaylistId,
        deletePlaylistId,
        loadRecommendations,
        clearUserHistory,
        toggleOfflineMode,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used inside a MusicProvider");
  }
  return context;
};
