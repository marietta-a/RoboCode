import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_FILE = path.join(__dirname, "storage.json");

// Initial data structure
const DEFAULT_DATA = {
  progress: {
    unlocked_levels: [1],
    robot_color: 'bg-blue-600',
    robot_accessory: null,
    total_score: 0,
    custom_functions: {}
  },
  high_scores: [] as { level_id: number; score: number }[]
};

async function getData() {
  try {
    const content = await fs.readFile(STORAGE_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    return DEFAULT_DATA;
  }
}

async function saveData(data: any) {
  await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/progress", async (req, res) => {
    const data = await getData();
    res.json({
      ...data.progress,
      high_scores: data.high_scores
    });
  });

  app.post("/api/progress", async (req, res) => {
    const { unlocked_levels, robot_color, robot_accessory, total_score, custom_functions } = req.body;
    const data = await getData();
    
    data.progress = {
      unlocked_levels: unlocked_levels || [1],
      robot_color: robot_color || 'bg-blue-600',
      robot_accessory: robot_accessory || null,
      total_score: total_score || 0,
      custom_functions: custom_functions || {}
    };
    
    await saveData(data);
    res.json({ status: "ok" });
  });

  app.post("/api/score", async (req, res) => {
    const { level_id, score } = req.body;
    const data = await getData();
    
    const existingIdx = data.high_scores.findIndex((s: any) => s.level_id === level_id);
    const existing = data.high_scores[existingIdx];
    
    if (!existing || score > existing.score) {
      if (existingIdx !== -1) {
        data.high_scores[existingIdx].score = score;
      } else {
        data.high_scores.push({ level_id, score });
      }
      await saveData(data);
      res.json({ status: "new_high_score", score });
    } else {
      res.json({ status: "ok", score: existing.score });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
