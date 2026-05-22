import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for external client deployments (like Vercel production hosting)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully for BJCmusic.");
  } else {
    console.warn("GEMINI_API_KEY not found in environment. AI recommendation and lookup might use fallback mocks.");
  }
} catch (e) {
  console.error("Failed to initialize Gemini Client:", e);
}

// In-Memory cache for YouTube Resolving (speeds up double-play)
const ytCache: Record<string, string> = {
  "perfect-ed_sheeran": "2Vv-BfVoq4g",
  "blinding_lights-the_weeknd": "4NRXx6U8ABQ",
  "as_it_was-harry_styles": "H5v3kku4y6Q",
  "flowers-miley_cyrus": "G7KNmW9a75Y",
  "starboy-the_weeknd": "34Na4j8AVgA",
  "shape_of_you-ed_sheeran": "RP7A06un9FM",
  "envolver-anitta": "hFCJu1_0L_Q",
  "la_danza-baco_exu_do_blues": "jSByoP2j8G4",
  "la_danza-baco_exu_do_gales": "jSByoP2j8G4",
  "sintomas_de_prazer-ludmilla": "O20eD4yZ_l8",
  "lofi_hiphop-study_beats": "jfKfPfyJRdk",
  "save_your_tears-the_weeknd": "XXYlSF60K8c",
  "don't_start_now-dua_lipa": "oygrmJFKYZY",
  "dance_monkey-tones_and_i": "q0hyYWLu-BY",
  "cheia_de_manias-raça_negra": "3s7S_VfubRE",
  "evidências-chitãozinho_&_xororó": "ePjJZD_6Iec",
  "anna_julia-los_hermanos": "K4w4M2f6v9M",
  "tempos_modernos-lulu_santos": "X9V9l6s_j-c",
  "piloto-flora_matos": "W9V-lO0U6YQ",
  "bohemian_rhapsody-queen": "fJ9rUzIMcZQ",
  "another_one_bites_the_dust-queen": "rY0WxgSXdEE",
  "creep-radiohead": "XFkzRNyygfk",
  "wonderwall-oasis": "6hzrDeceEKc",
  "smells_like_teen_spirit-nirvana": "hTWKbfoikeg",
  "hotel_california-eagles": "811QZGDYsxg"
};

// In-Memory caches for smart recommendations and lyrics (prevents exceeding Gemini free-tier daily quotas)
const recCache: Record<string, any> = {};
const lyricsCache: Record<string, string> = {};
const searchCache: Record<string, any> = {};

// Curated local songs catalog to make search and playback 100% resilient
const LOCAL_SONGS_CATALOG = [
  { id: "syn_1", title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400", youtubeId: "4NRXx6U8ABQ", duration: 200, type: "song" },
  { id: "syn_2", title: "Starboy", artist: "The Weeknd", album: "Starboy", coverUrl: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=400", youtubeId: "34Na4j8AVgA", duration: 230, type: "song" },
  { id: "syn_5", title: "As It Was", artist: "Harry Styles", album: "Harry's House", coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400", youtubeId: "H5v3kku4y6Q", duration: 167, type: "song" },
  { id: "syn_6", title: "Flowers", artist: "Miley Cyrus", album: "Endless Summer Vacation", coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400", youtubeId: "G7KNmW9a75Y", duration: 200, type: "song" },
  { id: "syn_7", title: "Perfect", artist: "Ed Sheeran", album: "Divide", coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400", youtubeId: "2Vv-BfVoq4g", duration: 263, type: "song" },
  { id: "syn_8", title: "Shape of You", artist: "Ed Sheeran", album: "Divide", coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400", youtubeId: "RP7A06un9FM", duration: 233, type: "song" },
  { id: "syn_9", title: "Save Your Tears", artist: "The Weeknd", album: "After Hours", coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400", youtubeId: "XXYlSF60K8c", duration: 215, type: "song" },
  { id: "syn_10", title: "Don't Start Now", artist: "Dua Lipa", album: "Future Nostalgia", coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400", youtubeId: "oygrmJFKYZY", duration: 183, type: "song" },
  
  { id: "br_1", title: "Sintomas de Prazer", artist: "Ludmilla", album: "Vilã", coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400", youtubeId: "O20eD4yZ_l8", duration: 142, type: "song" },
  { id: "br_2", title: "Envolver", artist: "Anitta", album: "Versions of Me", coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400", youtubeId: "hFCJu1_0L_Q", duration: 193, type: "song" },
  { id: "br_3", title: "La Danza", artist: "Baco Exu do Blues", album: "QVVJFA", coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400", youtubeId: "jSByoP2j8G4", duration: 184, type: "song" },
  { id: "br_4", title: "Piloto", artist: "Flora Matos", album: "Flora", coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400", youtubeId: "W9V-lO0U6YQ", duration: 180, type: "song" },
  { id: "br_5", title: "Evidências", artist: "Chitãozinho & Xororó", album: "Nossas Canções", coverUrl: "https://images.unsplash.com/photo-1482440308425-276ad0f28b19?w=400", youtubeId: "ePjJZD_6Iec", duration: 295, type: "song" },
  { id: "br_6", title: "Cheia de Manias", artist: "Raça Negra", album: "O Som do Samba", coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400", youtubeId: "3s7S_VfubRE", duration: 210, type: "song" },
  { id: "br_7", title: "Anna Julia", artist: "Los Hermanos", album: "Los Hermanos", coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400", youtubeId: "K4w4M2f6v9M", duration: 212, type: "song" },
  { id: "br_8", title: "Tempos Modernos", artist: "Lulu Santos", album: "Tempos Modernos", coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400", youtubeId: "X9V9l6s_j-c", duration: 268, type: "song" },
  
  { id: "roc_1", title: "Another One Bites The Dust", artist: "Queen", album: "The Game", coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400", youtubeId: "rY0WxgSXdEE", duration: 215, type: "song" },
  { id: "roc_2", title: "Bohemian Rhapsody", artist: "Queen", album: "A Night at the Opera", coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400", youtubeId: "fJ9rUzIMcZQ", duration: 354, type: "song" },
  { id: "roc_3", title: "Smells Like Teen Spirit", artist: "Nirvana", album: "Nevermind", coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400", youtubeId: "hTWKbfoikeg", duration: 301, type: "song" },
  { id: "roc_4", title: "Hotel California", artist: "Eagles", album: "Hotel California", coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400", youtubeId: "811QZGDYsxg", duration: 390, type: "song" },
  { id: "roc_5", title: "Creep", artist: "Radiohead", album: "Pablo Honey", coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400", youtubeId: "XFkzRNyygfk", duration: 238, type: "song" },
  { id: "roc_6", title: "Wonderwall", artist: "Oasis", album: "(What's the Story) Morning Glory?", coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400", youtubeId: "6hzrDeceEKc", duration: 258, type: "song" },
  
  { id: "lofi_1", title: "Lofi Hip Hop Study Beats", artist: "Lofi Girl", album: "Focus Lofi", coverUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400", youtubeId: "jfKfPfyJRdk", duration: 320, type: "song" },
  { id: "lofi_2", title: "Snowman (Lofi Version)", artist: "Lofi Beats", album: "Winter Vibes", coverUrl: "https://images.unsplash.com/photo-1482440308425-276ad0f28b19?w=400", youtubeId: "9y6Z5_HiafM", duration: 175, type: "song" },
  { id: "lofi_3", title: "Sunset Lover", artist: "Petit Biscuit", album: "Presence", coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400", youtubeId: "3ZleK7NfMec", duration: 237, type: "song" }
];

// API: Search music metadata via public Deezer endpoints + direct YouTube search via Gemini Search Grounding
app.get("/api/search", async (req, res) => {
  const query = (req.query.q as string || "").trim();
  if (!query) {
    return res.json({ data: [] });
  }

  // Helper to extract YouTube video ID from links or raw 11-char strings
  const getYoutubeId = (q: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = q.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return match[2];
    } else if (q.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(q)) {
      return q;
    }
    return null;
  };

  const detectedYtId = getYoutubeId(query);
  if (detectedYtId) {
    console.log(`[YouTube Direct Link Decoder] Processing YouTube link/ID: "${detectedYtId}"`);
    let title = "Vídeo do YouTube";
    let artist = "Canal do YouTube";
    let duration = 210;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `I have a YouTube Video ID: "${detectedYtId}". Use Google Search tools to search for this exact video or official song title, artist/creator name, and estimated video duration in seconds. Return your findings as raw valid JSON in this format: { "title": "Song/Video Name", "artist": "Artist or Channel Name", "duration": 220 }. Output ONLY raw valid JSON matching this schema. No markdown formatting, no comments.`,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
          }
        });
        const parsed = JSON.parse(response.text || "{}");
        if (parsed.title) title = parsed.title;
        if (parsed.artist) artist = parsed.artist;
        if (parsed.duration) duration = parseInt(parsed.duration) || 210;
        console.log(`[YouTube Direct Link Decoder] Decoded successfully: "${title}" by "${artist}" (${duration}s)`);
      } catch (err) {
        console.warn("[YouTube Direct Link Decoder] Metadata lookup failed, using fallback:", err);
      }
    }

    const decodedTrack = {
      id: `yt_link_${detectedYtId}`,
      title: title,
      artist: artist,
      album: "Link Decodificado do YouTube",
      coverUrl: `https://img.youtube.com/vi/${detectedYtId}/hqdefault.jpg`,
      youtubeId: detectedYtId,
      duration: duration,
      type: "song"
    };

    return res.json({ data: [decodedTrack] });
  }

  const cleanQuery = query.toLowerCase();
  if (searchCache[cleanQuery]) {
    console.log(`[Cache Hit] Serving cached search results for: "${cleanQuery}"`);
    return res.json({ data: searchCache[cleanQuery] });
  }

  // Pre-search: check matching items in our local pre-cached high-quality database
  const localMatches = LOCAL_SONGS_CATALOG.filter(t => 
    t.title.toLowerCase().includes(cleanQuery) || 
    t.artist.toLowerCase().includes(cleanQuery) || 
    t.album.toLowerCase().includes(cleanQuery)
  );

  let deezerTracks: any[] = [];
  let youtubeTracks: any[] = [];

  // Parallelized requests for extreme speed!
  const fetchDeezerPromise = (async () => {
    try {
      const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (response.ok) {
        const result = await response.json();
        if (result && !result.error && result.data) {
          deezerTracks = result.data.map((t: any) => ({
            id: `dz_${t.id}`,
            title: t.title,
            artist: t.artist.name,
            album: t.album.title,
            coverUrl: t.album.cover_medium || t.album.cover_big || "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=400",
            youtubeId: "", // will resolve on click
            duration: t.duration,
            type: 'song',
            audioUrl: t.preview
          }));
        }
      }
    } catch (deezerErr) {
      console.warn("Deezer search parallel fetch failed:", deezerErr);
    }
  })();

  const fetchYoutubePromise = (async () => {
    if (!ai) return;
    try {
      console.log(`[YouTube Gemini Integration] Fetching matching videos for "${query}" from YouTube...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Search for top high-quality audio or video uploads (official music videos, lyric videos, live performances, or official audio tracks) specifically on YouTube matching the query "${query}".
For each matching result, find the exact 11-character YouTube videoId, the song/video title, the artist/channel name, and the estimated duration of the video in seconds.
Return the results in a JSON array matching this exact schema:
[
  {
    "title": "Song Title",
    "artist": "Artist or Channel Name",
    "album": "YouTube Video",
    "coverUrl": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
    "youtubeId": "11-character video ID",
    "duration": 220
  }
]
Output ONLY raw valid JSON matching the schema. No markdown backticks, no other words.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                album: { type: Type.STRING },
                coverUrl: { type: Type.STRING },
                youtubeId: { type: Type.STRING },
                duration: { type: Type.INTEGER }
              },
              required: ["title", "artist", "album", "coverUrl", "youtubeId", "duration"]
            }
          }
        }
      });

      const text = response.text || "[]";
      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed)) {
        youtubeTracks = parsed.map((v: any, index: number) => ({
          id: `yt_${v.youtubeId || Math.random().toString(36).substr(2, 9)}_${index}`,
          title: v.title,
          artist: v.artist,
          album: v.album || "YouTube Video",
          coverUrl: v.youtubeId ? `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg` : (v.coverUrl || "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=400"),
          youtubeId: v.youtubeId,
          duration: v.duration || 200,
          type: "song"
        }));
        console.log(`Successfully parsed ${youtubeTracks.length} YouTube results directly via Gemini Google Search.`);
      }
    } catch (ytErr) {
      console.warn("YouTube Gemini search parallel fetch failed:", ytErr);
    }
  })();

  // Wait for both to complete
  await Promise.allSettled([fetchDeezerPromise, fetchYoutubePromise]);

  // Combine results with local matches, youtubeTracks, and deezerTracks
  const combined: any[] = [...localMatches];

  // Helper to add unique tracks
  const addIfUnique = (track: any) => {
    const exists = combined.some(ct => 
      (ct.youtubeId && track.youtubeId && ct.youtubeId === track.youtubeId) || 
      (ct.title.toLowerCase() === track.title.toLowerCase() && ct.artist.toLowerCase() === track.artist.toLowerCase())
    );
    if (!exists) {
      combined.push(track);
    }
  };

  // Add all youtube direct results first to guarantee absolute direct YouTube integration!
  youtubeTracks.forEach(addIfUnique);

  // Add Deezer results to fill in rich metadata
  deezerTracks.forEach(addIfUnique);

  // Fallback if combined is empty
  let finalTracks = combined;
  if (finalTracks.length === 0) {
    finalTracks = LOCAL_SONGS_CATALOG;
  }

  // Cache final results
  searchCache[cleanQuery] = finalTracks;

  res.json({ data: finalTracks });
});

// API: Direct MP3 Audio Stream Resolver
app.get("/api/resolve-audio", async (req, res) => {
  const title = req.query.title as string || "";
  const artist = req.query.artist as string || "";
  if (!title || !artist) {
    return res.status(400).json({ error: "Missing title or artist param" });
  }

  // Check if we have it already defined in our catalogue matching
  const catalogMatch = LOCAL_SONGS_CATALOG.find(t => 
    t.title.toLowerCase() === title.toLowerCase() && 
    t.artist.toLowerCase() === artist.toLowerCase()
  );
  if (catalogMatch && (catalogMatch as any).audioUrl) {
    return res.json({ audioUrl: (catalogMatch as any).audioUrl });
  }

  try {
    const searchUrl = `https://api.deezer.com/search?q=${encodeURIComponent(`${title} ${artist}`)}&limit=1`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (response.ok) {
      const result = await response.json();
      if (result.data && result.data[0] && result.data[0].preview) {
        return res.json({ audioUrl: result.data[0].preview });
      }
    }
  } catch (err) {
    console.error("Failed to dynamically resolve preview audio url:", err);
  }

  // Absolute safety sandbox fallback - beautiful royalty-free music that always plays
  res.json({ audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" });
});

// API: YouTube Video Resolver using Google Search grounding via Gemini
app.get("/api/yt-resolve", async (req, res) => {
  const title = req.query.title as string || "";
  const artist = req.query.artist as string || "";
  const isAlternative = req.query.alternative === "true";
  
  if (!title || !artist) {
    return res.status(400).json({ error: "Missing title or artist param" });
  }

  // Double check our catalog first to resolve instantly (only if not searching for an alternative)
  if (!isAlternative) {
    const catalogMatch = LOCAL_SONGS_CATALOG.find(t => 
      t.title.toLowerCase() === title.toLowerCase() && 
      t.artist.toLowerCase() === artist.toLowerCase()
    );
    if (catalogMatch && catalogMatch.youtubeId) {
      return res.json({ youtubeId: catalogMatch.youtubeId });
    }

    const cacheKey = `${title.toLowerCase()}-${artist.toLowerCase()}`.replace(/\s+/g, '_');
    if (ytCache[cacheKey]) {
      return res.json({ youtubeId: ytCache[cacheKey] });
    }
  }

  const cacheKeyAlt = `${title.toLowerCase()}-${artist.toLowerCase()}_alt`.replace(/\s+/g, '_');
  if (isAlternative && ytCache[cacheKeyAlt]) {
    return res.json({ youtubeId: ytCache[cacheKeyAlt] });
  }

  // Fallback pattern if Gemini is not loaded
  let videoId = "jfKfPfyJRdk"; // default cool beat

  if (ai) {
    try {
      const prompt = isAlternative 
        ? `Search for a completely DIFFERENT and alternate high-quality or official audio/lyrics upload of the song "${title}" by "${artist}" suitable for public embedding. Ground your answer in Google Search. Output ONLY the exact 11-character YouTube video ID. No formatting, no extra words.`
        : `Search for the official YouTube music video of "${title}" by "${artist}". Ground your answer in Google Search. Output ONLY the exact 11-character YouTube video ID (like dQw4w9WgXcQ or H5v3kku4y6Q). No formatting, no extra words.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text || "";
      const matches = rawText.match(/([a-zA-Z0-9_-]{11})/);
      if (matches && matches[1]) {
        videoId = matches[1];
        if (isAlternative) {
          ytCache[cacheKeyAlt] = videoId;
        } else {
          const cacheKey = `${title.toLowerCase()}-${artist.toLowerCase()}`.replace(/\s+/g, '_');
          ytCache[cacheKey] = videoId;
        }
        console.log(`Resolved youtubeId for "${title}" - "${artist}" (alternate=${isAlternative}) and cached: ${videoId}`);
      } else {
        throw new Error(`Invalid text: ${rawText}`);
      }
    } catch (err) {
      console.warn("Gemini with search grounding failed or restricted, trying direct prompt query fallback...", err);
      try {
        const prompt = isAlternative
          ? `Provide an alternate 11-character YouTube video ID (like lyric or audio version) for "${title}" by "${artist}". Output ONLY the 11-character ID. No formatting, no words.`
          : `What is the official 11-character YouTube video ID for the song "${title}" by "${artist}"? Output ONLY the 11-character ID (like dQw4w9WgXcQ or H5v3kku4y6Q). No formatting, no markdown, no other words.`;

        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
        const rawText = fallbackResponse.text || "";
        const matches = rawText.match(/([a-zA-Z0-9_-]{11})/);
        if (matches && matches[1]) {
          videoId = matches[1];
          if (isAlternative) {
            ytCache[cacheKeyAlt] = videoId;
          } else {
            const cacheKey = `${title.toLowerCase()}-${artist.toLowerCase()}`.replace(/\s+/g, '_');
            ytCache[cacheKey] = videoId;
          }
          console.log(`Resolved (fallback direct Gemini) youtubeId for "${title}" - "${artist}" (alternate=${isAlternative}): ${videoId}`);
        }
      } catch (fallbackErr) {
        console.error("Direct fallback also failed. Using steady lo-fi default loop.", fallbackErr);
      }
    }
  }

  res.json({ youtubeId: videoId });
});

// API: Get Radio Stations from Radio Browser API
app.get("/api/radios", async (req, res) => {
  const genre = req.query.genre as string || "pop";
  try {
    // de1.api.radio-browser.info is a public free unauthenticated system of radios
    const url = `https://de1.api.radio-browser.info/json/stations/bytag/${encodeURIComponent(genre)}?limit=15&order=votes&reverse=true`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Radio API returned ${response.status}`);
    }
    const stations = await response.json();
    
    // Convert to our Track structure suitable for streaming audio
    const tracks = (stations || []).map((st: any) => ({
      id: `radio_${st.changeuuid}`,
      title: st.name,
      artist: st.country || "Global Radio",
      album: st.tags ? st.tags.split(',').slice(0, 2).join(', ') : "Rádio Ao Vivo",
      coverUrl: st.favicon || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400",
      youtubeId: "",
      duration: 0, // infinite live streaming
      type: "radio",
      radioUrl: st.url_resolved || st.url,
    }));

    res.json({ data: tracks });
  } catch (err: any) {
    console.error("Radio fetch error:", err);
    res.json({ data: [], error: err.message });
  }
});

// API: Smart recommendations / similar songs via Gemini 3.5-flash
app.post("/api/recommendations", async (req, res) => {
  const { title, artist, recentTracks } = req.body;
  if (!title || !artist) {
    return res.status(400).json({ error: "Title and artist are required" });
  }

  const cacheKey = `${title.toLowerCase()}-${artist.toLowerCase()}`.replace(/\s+/g, '_');
  
  // 1. Check in-memory cache first to avoid API spam
  if (recCache[cacheKey]) {
    console.log(`[Cache Hit] Serving cached recommendations for "${title}" - "${artist}"`);
    return res.json({ data: recCache[cacheKey] });
  }

  // 2. Dynamic, high-quality local catalog recommendations (will be used as fallback)
  const getLocalFallbackRecommendations = () => {
    return LOCAL_SONGS_CATALOG
      .filter(t => t.title.toLowerCase() !== title.toLowerCase())
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
  };

  if (ai) {
    try {
      console.log(`[AI Request] Querying Gemini for similar songs to "${title}" - "${artist}"...`);
      const prompt = `Based on the song "${title}" by "${artist}", and recent listens: [${(recentTracks || []).map((t: any) => t.title).join(", ")}], suggest 5 similar tracks that would form a perfect seamless blend.
Respond ONLY with a JSON array inside a standard JSON format exactly following this schema:
[
  { "title": "Song name", "artist": "Artist name" }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING }
              },
              required: ["title", "artist"]
            }
          }
        }
      });

      const text = response.text || "[]";
      const recommendations = JSON.parse(text);

      // Now query Deezer fast for each recommendation to get proper covers and metadata context!
      const enrichedTracks = await Promise.all(
        recommendations.map(async (rec: any) => {
          try {
            const searchUrl = `https://api.deezer.com/search?q=${encodeURIComponent(`${rec.title} ${rec.artist}`)}&limit=1`;
            const dzRes = await fetch(searchUrl);
            const dzJson = await dzRes.json();
            if (dzJson.data && dzJson.data[0]) {
              const item = dzJson.data[0];
              return {
                id: `dz_${item.id}`,
                title: item.title,
                artist: item.artist.name,
                album: item.album.title,
                coverUrl: item.album.cover_medium || "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=400",
                youtubeId: "",
                duration: item.duration,
                type: "song"
              };
            }
          } catch {}
          // Fallback track from query if Deezer fails to lookup
          return {
            id: `rec_${Math.random().toString(36).substr(2, 9)}`,
            title: rec.title,
            artist: rec.artist,
            album: "BJC Selection",
            coverUrl: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=400",
            youtubeId: "",
            duration: 210,
            type: "song"
          };
        })
      );

      // Cache result and return
      recCache[cacheKey] = enrichedTracks;
      return res.json({ data: enrichedTracks });
    } catch (e: any) {
      console.warn(`[Safe Guard] Gemini recommendations unavailable or rate-limited (${e.message || e}). Serving high-fidelity local catalog matches.`);
    }
  }

  // 3. Fallback path if AI is unavailable, offline, or rate-limited (caching it too to prevent fast repeated requests)
  const fallbackRecs = getLocalFallbackRecommendations();
  recCache[cacheKey] = fallbackRecs;
  res.json({ data: fallbackRecs, source: "offline-fallback" });
});

// API: Get Scrolling Synced Lyrics for an outstanding player experience!
app.post("/api/lyrics", async (req, res) => {
  const { title, artist } = req.body;
  if (!title || !artist) {
    return res.status(400).json({ error: "Missing title or artist" });
  }

  const cacheKey = `${title.toLowerCase()}-${artist.toLowerCase()}`.replace(/\s+/g, '_');

  // 1. Check in-memory cache first to avoid API spam
  if (lyricsCache[cacheKey]) {
    console.log(`[Cache Hit] Serving cached lyrics for "${title}" - "${artist}"`);
    return res.json({ lyrics: lyricsCache[cacheKey] });
  }

  // 2. Custom beautifully structured fallback lyrics builder matching the song
  const getFallbackLyrics = () => {
    return `[00:00] Play with BJCmusic Audio Stream Engine
[00:04] Enjoy high quality playback
[00:08] [Letra de amostra para ${title} - ${artist}]
[00:12] Hummm... Sentindo a batida do som...
[00:18] [Verso 1]
[00:24] Caminhando pelas ruas da cidade neon
[00:30] O som bate suave nos meus fones de ouvido
[00:36] BJCmusic traz a rádio, as batidas e canções
[00:42] Sentindo a vibe que move os corações
[00:48] [Refrão]
[00:54] E o som toca forte, ele me guia no caminho
[01:00] Nunca estou sozinho com essa melodia
[01:06] Nas ondas do streaming que cruzam o espaço
[01:12] Toda sintonia se faz no compasso!
[01:20] Tocando agora: ${title} por ${artist}!`;
  };

  if (ai) {
    try {
      console.log(`[AI Request] Querying Gemini for lyrics of "${title}" - "${artist}"...`);
      const prompt = `Write beautifully structured lyrics for the song "${title}" by "${artist}". Add sync cues at the start of each paragraph, for example [00:15] or [01:45], marking major transitions like [Verse 1], [Chorus], etc.
Respond directly with the lyrics text. If you do not know the exact lyrics, generate a beautiful, accurate song poetry structure that resembles the lyrics perfectly. Feel free to translate or structure clearly.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const parsedLyrics = response.text || getFallbackLyrics();
      lyricsCache[cacheKey] = parsedLyrics;
      return res.json({ lyrics: parsedLyrics });
    } catch (e: any) {
      console.warn(`[Safe Guard] Gemini lyrics unavailable or rate-limited (${e.message || e}). Serving beautifully crafted fallback lyrics.`);
    }
  }

  // 3. Keep cached fallback structured lyrics
  const fallbackLyrics = getFallbackLyrics();
  lyricsCache[cacheKey] = fallbackLyrics;
  res.json({ lyrics: fallbackLyrics });
});

// Set up dynamic preload of local catalog sound previews via Deezer
async function preloadLocalCatalogPreviews() {
  console.log("Preloading BJCmusic Local Catalog Audio Previews...");
  for (const song of LOCAL_SONGS_CATALOG) {
    try {
      const searchUrl = `https://api.deezer.com/search?q=${encodeURIComponent(`${song.title} ${song.artist}`)}&limit=1`;
      const res = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data[0] && json.data[0].preview) {
          (song as any).audioUrl = json.data[0].preview;
          console.log(`Preloaded direct audio to catalog for: "${song.title}"`);
        }
      }
    } catch (err) {
      console.warn(`Could not preload audio preview for ${song.title}:`, err);
    }
  }
}

// Implement Vite server integration for local development or serve compiled build
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html as SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BJCmusic Full-Stack Server running on http://localhost:${PORT}`);
    // Start asynchronous pre-fetching of direct sample streams
    preloadLocalCatalogPreviews().catch(err => console.error("Catalog preload failed:", err));
  });
}

startServer();
