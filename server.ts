import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

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

// API: Search music metadata via public Deezer endpoints
app.get("/api/search", async (req, res) => {
  const query = (req.query.q as string || "").trim();
  if (!query) {
    return res.json({ data: [] });
  }

  // Pre-search: check matching items in our local pre-cached high-quality database
  const cleanQ = query.toLowerCase();
  const localMatches = LOCAL_SONGS_CATALOG.filter(t => 
    t.title.toLowerCase().includes(cleanQ) || 
    t.artist.toLowerCase().includes(cleanQ) || 
    t.album.toLowerCase().includes(cleanQ)
  );

  try {
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) {
      throw new Error(`Deezer API returned ${response.status}`);
    }
    const result = await response.json();
    
    // Transform to our Track model schema
    const tracks = (result.data || []).map((t: any) => ({
      id: `dz_${t.id}`,
      title: t.title,
      artist: t.artist.name,
      album: t.album.title,
      coverUrl: t.album.cover_medium || t.album.cover_big || "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=400",
      youtubeId: "", // Will be resolved dynamically when selected
      duration: t.duration,
      type: 'song'
    }));

    // Combine local catalog matches to guarantee playability at the very top of search results
    const combinedTracks = [...localMatches];
    tracks.forEach((t: any) => {
      if (!combinedTracks.some(ct => ct.title.toLowerCase() === t.title.toLowerCase() && ct.artist.toLowerCase() === t.artist.toLowerCase())) {
        combinedTracks.push(t);
      }
    });

    res.json({ data: combinedTracks });
  } catch (error: any) {
    console.error("Search error, falling back to local matches:", error);
    // If the external network failed or is blocked, return the high-fidelity local catalog matches, or the full catalog if no specific match
    const fallbackResults = localMatches.length > 0 ? localMatches : LOCAL_SONGS_CATALOG;
    res.json({ data: fallbackResults, isFallback: true });
  }
});

// API: YouTube Video Resolver using Google Search grounding via Gemini
app.get("/api/yt-resolve", async (req, res) => {
  const title = req.query.title as string || "";
  const artist = req.query.artist as string || "";
  
  if (!title || !artist) {
    return res.status(400).json({ error: "Missing title or artist param" });
  }

  // Double check our catalog first to resolve instantly
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

  // Fallback pattern if Gemini is not loaded
  let videoId = "jfKfPfyJRdk"; // default cool beat

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Search for the official YouTube music video of "${title}" by "${artist}". Ground your answer in Google Search. Output ONLY the exact 11-character YouTube video ID (like dQw4w9WgXcQ or H5v3kku4y6Q). No formatting, no extra words.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text || "";
      const matches = rawText.match(/([a-zA-Z0-9_-]{11})/);
      if (matches && matches[1]) {
        videoId = matches[1];
        ytCache[cacheKey] = videoId;
        console.log(`Resolved youtubeId for "${title}" - "${artist}" and cached: ${videoId}`);
      } else {
        console.warn(`No Youtube ID match, raw text returned: ${rawText}`);
      }
    } catch (err) {
      console.error("Gemini failed to resolve Youtube ID, using fallback fetch.", err);
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

  if (ai) {
    try {
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
          // Fallback track if Deezer query fails
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

      return res.json({ data: enrichedTracks });
    } catch (e: any) {
      console.error("Gemini recommendation error:", e);
    }
  }

  // Pre-configured rich fallbacks if AI is unavailable
  res.json({
    data: [
      {
        id: "dz_1109731",
        title: "Creep",
        artist: "Radiohead",
        album: "Pablo Honey",
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
        youtubeId: "XFkzRNyygfk",
        duration: 238,
        type: "song"
      },
      {
        id: "dz_1109732",
        title: "Wonderwall",
        artist: "Oasis",
        album: "(What's the Story) Morning Glory?",
        coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400",
        youtubeId: "6hzrDeceEKc",
        duration: 258,
        type: "song"
      },
      {
        id: "dz_1109733",
        title: "Smells Like Teen Spirit",
        artist: "Nirvana",
        album: "Nevermind",
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
        youtubeId: "hTWKbfoikeg",
        duration: 301,
        type: "song"
      }
    ]
  });
});

// API: Get Scrolling Synced Lyrics for an outstanding player experience!
app.post("/api/lyrics", async (req, res) => {
  const { title, artist } = req.body;
  if (!title || !artist) {
    return res.status(400).json({ error: "Missing title or artist" });
  }

  if (ai) {
    try {
      const prompt = `Write beautifully structured lyrics for the song "${title}" by "${artist}". Add sync cues at the start of each paragraph, for example [00:15] or [01:45], marking major transitions like [Verse 1], [Chorus], etc.
Respond directly with the lyrics text. If you do not know the exact lyrics, generate a beautiful, accurate song poetry structure that resembles the lyrics perfectly. Feel free to translate or structure clearly.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      return res.json({ lyrics: response.text || "Letras não disponíveis." });
    } catch (e: any) {
      console.error("Gemini lyrics failure:", e);
    }
  }

  // Beautiful curated fallback lyrics
  res.json({
    lyrics: `[00:00] Play with BJCmusic Audio Stream Engine
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
[01:20] Tocando agora: ${title}!`
  });
});

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
  });
}

startServer();
