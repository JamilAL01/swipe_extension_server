import express from "express";
import bodyParser from "body-parser";
import pkg from "pg";
import cors from "cors";

const { Pool } = pkg;

const app = express();
const port = 4000;

// ================== PostgreSQL CONNECTION ==================
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "swipe_db",
  password: "J@mil01abou",
  port: 5432,
});
// ================== MIDDLEWARE ==================
app.use(bodyParser.json());
app.use(cors()); // allow all origins (or restrict to your extension)

// ================== API ROUTES ==================

// Endpoint to receive events from extension
app.post("/api/events", async (req, res) => {
  try {
    const {
      sessionId,
      videoId,
      type,
      timestamp,
      src = null,
      watchedTime = null,
      duration = null,
      percent = null,
      extra = {},
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }
    if (!videoId) {
      return res.status(400).json({ error: "videoId is required" });
    }
    if (!type) {
      return res.status(400).json({ error: "type is required" });
    }
    if (!timestamp) {
      return res.status(400).json({ error: "timestamp is required" });
    }

    // Insert event into database
    await pool.query(
      `INSERT INTO video_events 
      (session_id, video_id, src, event_type, ts, extra, watched_time, duration, percent)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        sessionId,
        videoId,
        src,
        type,
        extra,
        watchedTime,
        duration,
        percent,
      ]
    );

    res.json({ status: "ok", saved: req.body });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ================== START SERVER ==================
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
