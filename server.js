import express from "express";
import bodyParser from "body-parser";
import pkg from "pg";
import cors from "cors";

const app = express();
const port = process.env.PORT || 4000;

// ================== PostgreSQL CONNECTION ==================
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Render
});

// ================== MIDDLEWARE ==================
app.use(bodyParser.json());
app.use(cors());

// ================== API ROUTES ==================
app.post("/api/events", async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      videoId,
      type,
      timestamp,
      src = null,
      watchedTime = null,
      duration = null,
      percent = null,
      extra = {},
      channelName = null,   // <-- new field
    } = req.body;

    if (!userId || !sessionId || !videoId || !type || !timestamp) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await pool.query(
      `INSERT INTO video_events 
      (user_id, session_id, video_id, src, event_type, ts, extra, watched_time, duration, percent, channel_name)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        userId,
        sessionId,
        videoId,
        src,
        type,
        timestamp,
        extra,
        watchedTime,
        duration,
        percent,
        channelName,   // <-- pass it here
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
