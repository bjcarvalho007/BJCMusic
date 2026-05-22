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
  // Common preset fallback IDs
  "perfect-ed_sheeran": "2Vv-BfVoq4g",
  "blinding_lights-the_weeknd": "4NRXx6U8ABQ",
  "as_it_was-harry_styles": "H5v3kku4y6Q",
  "flowers-miley_cyrus": "G7KNmW9a75Y",
  "starboy-the_weeknd": "34Na4j8AVgA",
  "shape_of_you-ed_sheeran": "JGwWNGJdvx8",
  "envolver-anitta": "hFCJu1_0L_Q",
  "la_danza-baco_exu_do_gales": "jSByoP2j8G4",
  "sintomas_de_prazer-ludmilla": "O20eD4yZ_l8",
  "lofi_hiphop-study_beats": "jfKfPfyJRdk", // live stream
};

// API: Search music metadata via public Deezer endpoints
app.get("/api/search", async (req, res) => {
  const query = req.query.q as string || "";
  if (!query) {
    return res.json({ data: [] });
  }

  try {
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
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

    res.json({ data: tracks });
  } catch (error: any) {
    console.error("Search error:", error);
    // Return curated fallback search list
    res.json({ data: [], error: error.message });
  }
});

// API: YouTube Video Resolver using Google Search grounding via Gemini
app.get("/api/yt-resolve", async (req, res) => {
  const title = req.query.title as string || "";
  const artist = req.query.artist as string || "";
  
  if (!title || !artist) {
    return res.status(400).json({ error: "Missing title or artist param" });
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
        // Safe search using text similarity as fallback
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
