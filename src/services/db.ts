import { Track, Playlist, UserStats } from "../types";

// State Keys
const KEYS = {
  FAVORITES: "bjcmusic_favorites",
  PLAYLISTS: "bjcmusic_playlists",
  HISTORY: "bjcmusic_history",
  DOWNLOADS: "bjcmusic_downloads",
  STATS: "bjcmusic_stats",
};

// Safe wrapper for localStorage access
const storage = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch (e) {
      console.error(`Error reading ${key} from storage`, e);
      return fallback;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to storage`, e);
    }
  }
};

/**
 * BJCmusic Decoupled Local Database Service
 * 
 * DESIGN CONTEXT FOR FUTURE EXPANSION:
 * All operations below are modeled as Promises. This enables a drop-in replacement 
 * of this file with Firebase Firestore/Auth or local IndexedDB APIs. The components
 * will not need modification!
 */
export const dbService = {
  // FAVORITES
  async getFavorites(): Promise<Track[]> {
    return storage.get<Track[]>(KEYS.FAVORITES, []);
  },

  async addFavorite(track: Track): Promise<Track[]> {
    const favs = await this.getFavorites();
    if (!favs.some((t) => t.id === track.id)) {
      const updated = [{ ...track, isFavorite: true }, ...favs];
      storage.set(KEYS.FAVORITES, updated);
      return updated;
    }
    return favs;
  },

  async removeFavorite(trackId: string): Promise<Track[]> {
    const favs = await this.getFavorites();
    const updated = favs.filter((t) => t.id !== trackId);
    storage.set(KEYS.FAVORITES, updated);
    return updated;
  },

  async isFavorite(trackId: string): Promise<boolean> {
    const favs = await this.getFavorites();
    return favs.some((t) => t.id === trackId);
  },

  // PLAYLISTS (Custom Playlists created by user)
  async getPlaylists(): Promise<Playlist[]> {
    return storage.get<Playlist[]>(KEYS.PLAYLISTS, []);
  },

  async createPlaylist(name: string, description: string = "", coverUrl?: string): Promise<Playlist[]> {
    const playlists = await this.getPlaylists();
    const newPlaylist: Playlist = {
      id: `pl_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      coverUrl: coverUrl || "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400",
      tracks: [],
      isCustom: true,
      createdAt: new Date().toISOString()
    };
    const updated = [newPlaylist, ...playlists];
    storage.set(KEYS.PLAYLISTS, updated);
    return updated;
  },

  async addTrackToPlaylist(playlistId: string, track: Track): Promise<Playlist[]> {
    const playlists = await this.getPlaylists();
    const updated = playlists.map((pl) => {
      if (pl.id === playlistId) {
        if (!pl.tracks.some((t) => t.id === track.id)) {
          return { ...pl, tracks: [...pl.tracks, track] };
        }
      }
      return pl;
    });
    storage.set(KEYS.PLAYLISTS, updated);
    return updated;
  },

  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<Playlist[]> {
    const playlists = await this.getPlaylists();
    const updated = playlists.map((pl) => {
      if (pl.id === playlistId) {
        return { ...pl, tracks: pl.tracks.filter((t) => t.id !== trackId) };
      }
      return pl;
    });
    storage.set(KEYS.PLAYLISTS, updated);
    return updated;
  },

  async deletePlaylist(playlistId: string): Promise<Playlist[]> {
    const playlists = await this.getPlaylists();
    const updated = playlists.filter((pl) => pl.id !== playlistId);
    storage.set(KEYS.PLAYLISTS, updated);
    return updated;
  },

  // HISTORY
  async getHistory(): Promise<Track[]> {
    return storage.get<Track[]>(KEYS.HISTORY, []);
  },

  async addHistoryEntry(track: Track): Promise<Track[]> {
    const history = await this.getHistory();
    // Delete duplicate and add to front (most recent)
    const filtered = history.filter((t) => t.id !== track.id);
    const updated = [track, ...filtered].slice(0, 50); // limit to 50 items
    storage.set(KEYS.HISTORY, updated);

    // Update listening stats
    await this.incrementStats(track);
    return updated;
  },

  async clearHistory(): Promise<void> {
    storage.set(KEYS.HISTORY, []);
  },

  // DOWNLOADS (Simulated Premium Cache / Smart Offline System)
  async getDownloads(): Promise<Track[]> {
    return storage.get<Track[]>(KEYS.DOWNLOADS, []);
  },

  async addDownload(track: Track): Promise<Track[]> {
    const dls = await this.getDownloads();
    if (!dls.some((t) => t.id === track.id)) {
      const updated = [
        { 
          ...track, 
          isOffline: true, 
          downloadProgress: 100, 
          downloadedAt: new Date().toISOString() 
        }, 
        ...dls
      ];
      storage.set(KEYS.DOWNLOADS, updated);
      return updated;
    }
    return dls;
  },

  async removeDownload(trackId: string): Promise<Track[]> {
    const dls = await this.getDownloads();
    const updated = dls.filter((t) => t.id !== trackId);
    storage.set(KEYS.DOWNLOADS, updated);
    return updated;
  },

  async isDownloaded(trackId: string): Promise<boolean> {
    const dls = await this.getDownloads();
    return dls.some((t) => t.id === trackId);
  },

  // USER STATS (Listening metrics)
  async getStats(): Promise<UserStats> {
    return storage.get<UserStats>(KEYS.STATS, {
      songsListened: 0,
      minutesListened: 0,
      topArtist: "Nenhum",
      topGenre: "Lo-fi / Ambient"
    });
  },

  async incrementStats(track: Track): Promise<void> {
    const stats = await this.getStats();
    stats.songsListened += 1;
    // Assume average duration is 3.5 minutes if 0
    const addMinutes = track.duration > 0 ? Math.round(track.duration / 60) : 3;
    stats.minutesListened += addMinutes;
    stats.topArtist = track.artist; // Keep simple: set current artist as top favorite
    
    storage.set(KEYS.STATS, stats);
  },

  async clearAllData(): Promise<void> {
    storage.set(KEYS.FAVORITES, []);
    storage.set(KEYS.HISTORY, []);
    storage.set(KEYS.PLAYLISTS, []);
    storage.set(KEYS.DOWNLOADS, []);
    storage.set(KEYS.STATS, {
      songsListened: 0,
      minutesListened: 0,
      topArtist: "Nenhum",
      topGenre: "Nenhum"
    });
  }
};
