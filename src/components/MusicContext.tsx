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

// Resolve API endpoints dynamically, especially on external static hosts like Vercel
const getApiUrl = (endpoint: string) => {
  const isLocalOrPreviewDev = 
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes("run.app") ||
    window.location.hostname.includes("aistudio-build") ||
    window.location.hostname.includes("webcontainer-api");

  // Keep pointing to the live, compiled Cloud Run full-stack container when running on custom domains/Vercel
  const backendOverride = "https://ais-pre-vieo2kqiebinbcczbwwy2j-627715817369.us-east1.run.app";
  const baseUrl = isLocalOrPreviewDev ? "" : backendOverride;
  return `${baseUrl}${endpoint}`;
};

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
  const pendingTrackRef = useRef<{ track: Track; tracksContext?: Track[] } | null>(null);
  const activeEngineRef = useRef<"youtube" | "fallback">("youtube");
  const activeTrackIdRef = useRef<string | null>(null);
  const ytTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const altYtTriedRef = useRef<Record<string, boolean>>({});

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

  // Keep refs up-to-date to avoid stale closures in event listeners
  const nextTrackRef = useRef<() => void>(() => {});
  useEffect(() => {
    nextTrackRef.current = nextTrack;
  }, [nextTrack]);

  const handleYoutubePlayerErrorRef = useRef<() => Promise<void>>(() => Promise.resolve());
  useEffect(() => {
    handleYoutubePlayerErrorRef.current = handleYoutubePlayerError;
  }, [currentTrack, volume, speed]);

  // Create HTML5 Audio exactly once on mount, and preserve its listeners across state changes
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onPlay = () => {
      if (activeEngineRef.current !== "youtube") {
        setIsPlaying(true);
      }
    };
    const onPause = () => {
      if (activeEngineRef.current !== "youtube") {
        setIsPlaying(false);
      }
    };
    const onDurationChange = () => {
      if (activeEngineRef.current !== "youtube") {
        setDuration(audio.duration || 0);
      }
    };
    const onEnded = () => {
      if (activeEngineRef.current !== "youtube" && !audio.loop) {
        nextTrackRef.current();
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Load YouTube script on mount and keep players initialized once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      const target = document.getElementById("bjcmusic-yt-player-target");
      if (!target) {
        setTimeout(initPlayer, 150);
        return;
      }

      try {
        ytPlayerRef.current = new window.YT.Player("bjcmusic-yt-player-target", {
          host: "https://www.youtube.com",
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
                if (pendingTrackRef.current) {
                  const queued = pendingTrackRef.current;
                  pendingTrackRef.current = null;
                  playTrack(queued.track, queued.tracksContext);
                }
              }
            },
            onStateChange: (event: any) => {
              console.log("YouTube Player state change event:", event.data);
              // State 0 (ENDED)
              if (event.data === 0) {
                if (activeEngineRef.current === "youtube") {
                  console.log("YouTube track finished. Triggering next track.");
                  nextTrackRef.current();
                }
              }
              // State 1 (PLAYING)
              if (event.data === 1) {
                if (activeEngineRef.current === "youtube") {
                  setIsPlaying(true);
                }
              }
              // State 2 (PAUSED)
              if (event.data === 2) {
                if (activeEngineRef.current === "youtube") {
                  setIsPlaying(false);
                }
              }
            },
            onError: (event: any) => {
              console.error("YouTube Player error encountered:", event.data);
              if (activeEngineRef.current === "youtube") {
                handleYoutubePlayerErrorRef.current();
              }
            }
          },
        });
      } catch (err) {
        console.error("Failed to construct YouTube player:", err);
      }
    };

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    }

    return () => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === "function") {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }
    };
  }, []);

  // Progress poller for Youtube and direct HTML5 audio playbacks
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentTrack) {
        if (currentTrack.type === "song") {
          if (activeEngineRef.current === "youtube") {
            if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
              try {
                const state = ytPlayerRef.current.getPlayerState();
                setProgress(ytPlayerRef.current.getCurrentTime() || 0);
                const dur = ytPlayerRef.current.getDuration() || 0;
                if (dur > 0) {
                  setDuration(prev => prev !== dur ? dur : prev);
                }
              } catch {}
            }
          } else {
            // Unmuted fallback direct audio stream engine is active
            if (isPlaying) {
              setProgress((prev) => {
                const next = prev + 0.5;
                if (next >= duration) {
                  setTimeout(() => nextTrackRef.current(), 0);
                  return duration;
                }
                return next;
              });
            }
          }
        } else if (currentTrack.type === "radio" && audioRef.current) {
          setProgress(audioRef.current.currentTime || 0);
        }
      }
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [currentTrack, isPlaying, duration]);

  // Navigate tabs helper
  const changeTab = (tab: string, meta?: any) => {
    setActiveTab(tab);
    if (tab === "playlist" && meta) {
      setCurrentPlaylist(meta);
    } else if (tab === "artist" && meta) {
      setSelectedArtist(meta);
    }
  };

  // Handle YouTube player error by looking for an alternative search or triggering HTML5 audio preview as ultimate fallback
  const handleYoutubePlayerError = async () => {
    if (!currentTrack) return;
    console.warn(`YouTube playback error on track: ${currentTrack.title} - ${currentTrack.artist}. Attempting dynamic recovery...`);
    
    // Check if we've already tried resolving an alternative track ID
    if (!altYtTriedRef.current[currentTrack.id]) {
      altYtTriedRef.current[currentTrack.id] = true;
      try {
        console.log("Requesting alternative YouTube video ID to bypass copyright or embed blocks...");
        const res = await fetch(getApiUrl(`/api/yt-resolve?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}&alternative=true`));
        const data = await res.json();
        
        if (data.youtubeId && ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
          currentTrack.youtubeId = data.youtubeId;
          console.log(`Loaded alternative YouTube video ID successfully: ${data.youtubeId}`);
          ytPlayerRef.current.loadVideoById(data.youtubeId);
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(volume * 100);
          try {
            ytPlayerRef.current.setPlaybackRate(speed);
          } catch {}
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          return;
        }
      } catch (err) {
        console.error("Dynamic YouTube lookup failed for fallback search:", err);
      }
    }

    // Ultimate fallback: Use direct HTML5 Audio preview to ensure BJCmusic NEVER goes silent!
    console.warn("YouTube video completely blocked or unavailable. Falling back seamlessly to direct preview stream.");
    activeEngineRef.current = "fallback";
    
    let fallbackUrl = currentTrack.audioUrl;
    if (fallbackUrl) {
      if (fallbackUrl.startsWith("http://")) {
        fallbackUrl = fallbackUrl.replace("http://", "https://");
      }
      if (audioRef.current) {
        try {
          audioRef.current.src = fallbackUrl;
          audioRef.current.loop = true;
          audioRef.current.volume = volume;
          try {
            audioRef.current.playbackRate = speed;
          } catch {}
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (audioErr) {
          console.error("HTML5 fallback sound also failed to bind:", audioErr);
          nextTrack(); // skip to next track immediately to prevent getting stuck
        }
      }
    } else {
      // Direct skipping if no cover audio can be found
      nextTrack();
    }
  };

  // Resolve YouTube ID and play safely with hybrid dual-player stream engine
  const playTrack = async (track: Track, tracksContext?: Track[]) => {
    if (isOfflineMode && !track.isOffline) {
      alert("Essa música não está disponível no modo Offline. Ative seu sinal ou baixe-a primeiro!");
      return;
    }

    activeTrackIdRef.current = track.id;
    setProgress(0);

    // Clear any previous active YouTube timeout
    if (ytTimeoutRef.current) {
      clearTimeout(ytTimeoutRef.current);
      ytTimeoutRef.current = null;
    }

    // Stop all current playbacks immediately to avoid overlapping sound
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = "";
      } catch {}
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
      try {
        ytPlayerRef.current.pauseVideo();
      } catch {}
    }

    setIsPlaying(false);
    setProgress(0);
    
    // Set a proper, complete track duration (the full song length!)
    const trackDuration = track.duration || 210; // default to 210 seconds if not provided
    setDuration(trackDuration);
    setCurrentTrack(track);

    // Save playing context queue
    if (tracksContext && tracksContext.length > 0) {
      const idx = tracksContext.findIndex((t) => t.id === track.id);
      if (idx !== -1) {
        setQueue(tracksContext.slice(idx + 1));
      } else {
        setQueue(tracksContext);
      }
    }

    // Save Track Listen Entry & stats
    try {
      const updatedHistory = await dbService.addHistoryEntry(track);
      setHistoryList(updatedHistory);
      const updatedStats = await dbService.getStats();
      setStats(updatedStats);
    } catch {}

    // Fetch Lyrics immediately
    fetchLyrics(track);

    // Load recommendations dynamically
    fetchRecommendations(track);

    // Preload next track's YouTube ID in background for ultra-smooth instant streaming of successive tracks
    const nextInLine = tracksContext && tracksContext.length > 0 
      ? tracksContext[tracksContext.findIndex((t) => t.id === track.id) + 1]
      : queue[0];
    if (nextInLine && !nextInLine.youtubeId && nextInLine.type !== "radio") {
      fetch(getApiUrl(`/api/yt-resolve?title=${encodeURIComponent(nextInLine.title)}&artist=${encodeURIComponent(nextInLine.artist)}`))
        .then(res => res.json())
        .then(data => {
          if (data.youtubeId) {
            nextInLine.youtubeId = data.youtubeId;
            console.log(`[Preload] Resolved youtubeID for upcoming track: "${nextInLine.title}"`);
          }
        }).catch(() => {});
    }

    if (track.type === "radio") {
      // Live Radio Stream (never looped, always HTML5 Audio streaming)
      activeEngineRef.current = "fallback";
      if (audioRef.current && track.radioUrl) {
        let radioUrl = track.radioUrl;
        if (radioUrl.startsWith("http://")) {
          radioUrl = radioUrl.replace("http://", "https://");
        }
        try {
          audioRef.current.loop = false;
          audioRef.current.src = radioUrl;
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (e) {
          console.error("Live streaming failed:", e);
          alert("Não foi possível carregar esta rádio ao vivo. Tente outro canal!");
        }
      }
    } else {
      // SONG STREAMING - YouTube Master audio engine!
      activeEngineRef.current = "youtube";

      // 1. Resolve and play the YouTube video unmuted to stream audio directly
      let ytId = track.youtubeId;
      if (!ytId) {
        try {
          const res = await fetch(getApiUrl(`/api/yt-resolve?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`));
          const data = await res.json();
          if (data.youtubeId) {
            ytId = data.youtubeId;
            track.youtubeId = ytId;
          }
        } catch (err) {
          console.error("Failed to fetch backing video:", err);
        }
      }
      if (!ytId) ytId = "jfKfPfyJRdk"; // default stable lofi beat if lookup fails

      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
        try {
          console.log(`Streaming official audio unmuted via YouTube IFrame: ${ytId}`);
          ytPlayerRef.current.loadVideoById(ytId);
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(volume * 100);
          try {
            ytPlayerRef.current.setPlaybackRate(speed);
          } catch {}
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        } catch (err) {
          console.error("Failed to play track through YouTube IFrame:", err);
          handleYoutubePlayerError(); // fall back if loading crashes
        }
      } else {
        // If YouTube player script is not ready or is sandboxed, fall back seamlessly to HTML5 sound preview
        console.warn("YouTube script is not fully initialized. Falling back synchronously to direct HTML5 sound.");
        activeEngineRef.current = "fallback";
        let fallbackUrl = track.audioUrl;
        if (fallbackUrl && fallbackUrl.startsWith("http://")) {
          fallbackUrl = fallbackUrl.replace("http://", "https://");
        }
        const initialAudioUrl = fallbackUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
        if (audioRef.current) {
          try {
            audioRef.current.src = initialAudioUrl;
            audioRef.current.loop = true;
            audioRef.current.volume = volume;
            try {
              audioRef.current.playbackRate = speed;
            } catch {}
            await audioRef.current.play();
            setIsPlaying(true);
          } catch (e) {
            console.error("HTML5 synchronous sound initiation failed:", e);
          }
        }
      }
    }
  };

  // Toggle Pause Play supporting both YouTube and HTML5 fallbacks instantly
  const togglePlay = () => {
    if (!currentTrack) return;

    const nextPlayState = !isPlaying;
    setIsPlaying(nextPlayState);

    if (activeEngineRef.current === "youtube") {
      if (ytPlayerRef.current) {
        try {
          if (nextPlayState) {
            ytPlayerRef.current.unMute();
            ytPlayerRef.current.setVolume(volume * 100);
            if (typeof ytPlayerRef.current.playVideo === "function") {
              ytPlayerRef.current.playVideo();
            }
          } else {
            if (typeof ytPlayerRef.current.pauseVideo === "function") {
              ytPlayerRef.current.pauseVideo();
            }
          }
        } catch (err) {
          console.error("YouTube Player toggle error:", err);
        }
      }
    } else {
      if (audioRef.current) {
        try {
          if (nextPlayState) {
            audioRef.current.play().catch((err) => {
              console.warn("HTML5 Playback blocked on toggle:", err);
            });
          } else {
            audioRef.current.pause();
          }
        } catch (err) {
          console.error("HTML5 player toggle error:", err);
        }
      }
    }
  };

  // Play Next Song in Queue
  function nextTrack() {
    if (queue.length > 0) {
      const next = queue[0];
      const remaining = queue.slice(1);
      setQueue(remaining);
      playTrack(next);
    } else if (smartRecs.length > 0) {
      // Autoplay inteligente / Radio infinita: select a recommended track dynamically
      const randomRec = smartRecs[Math.floor(Math.random() * smartRecs.length)];
      console.log("Queue ended. Autoplay selecting recommended track next:", randomRec.title);
      playTrack(randomRec);
    } else {
      // Loop or restart currently playing track
      if (currentTrack) {
        seekTo(0);
      }
    }
  }

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

  // Seek Progress supporting both engines seamlessly
  const seekTo = (seconds: number) => {
    if (!currentTrack) return;
    if (currentTrack.type === "radio") return; // cannot seek live stream

    // Update progress state locally first
    setProgress(seconds);

    // 1. Seek the HTML5 Audio
    if (audioRef.current) {
      try {
        const audioDur = audioRef.current.duration;
        if (audioDur) {
          // Loop math: handles the 30s fallback preview within the full duration bounds elegantly!
          audioRef.current.currentTime = seconds % audioDur;
        } else {
          audioRef.current.currentTime = 0;
        }
      } catch (e) {
        console.error("Seek error in HTML5 Audio:", e);
      }
    }

    // 2. Seek the YouTube video player
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      try {
        ytPlayerRef.current.seekTo(seconds, true);
      } catch (err) {
        console.error("Seek error in YouTube:", err);
      }
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
      const res = await fetch(getApiUrl(`/api/search?q=${encodeURIComponent(q)}`));
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
      const res = await fetch(getApiUrl(`/api/radios?genre=${encodeURIComponent(genre)}`));
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
      const response = await fetch(getApiUrl("/api/lyrics"), {
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
      const response = await fetch(getApiUrl("/api/recommendations"), {
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
