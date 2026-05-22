export interface Track {
  id: string; // youtubeId or deezerId
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  youtubeId: string;
  duration: number; // in seconds
  isOffline?: boolean;
  isFavorite?: boolean;
  downloadProgress?: number; // 0 to 100
  downloadedAt?: string;
  playCount?: number;
  lyrics?: string;
  type: 'song' | 'radio';
  radioUrl?: string; // used for live radio streaming
  audioUrl?: string; // used for highly resilient direct MP3 audio playback
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
  isCustom?: boolean;
  createdAt?: string;
}

export interface RadioStation {
  changeuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  language: string;
  votes: number;
}

export interface UserStats {
  songsListened: number;
  minutesListened: number;
  topArtist: string;
  topGenre: string;
}
