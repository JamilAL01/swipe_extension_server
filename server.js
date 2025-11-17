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
  ssl: { rejectUnauthorized: false }
});

// ================== MIDDLEWARE ==================
app.use(bodyParser.json());
app.use(cors());

// ================== API ROUTES ==================

// Save video events
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
      channelName = null,
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
        channelName,
      ]
    );

    res.json({ status: "ok", saved: req.body });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// 📝 Save survey responses
app.post("/api/surveys", async (req, res) => {
  try {
    const { userId, sessionId, answers, screen_size, device_type, timestamp } = req.body;

    if (!userId || !sessionId || !answers) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO survey_responses 
       (user_id, session_id, answers, screen_size, device_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [userId, sessionId, answers, screen_size, device_type, timestamp || new Date()]
    );

    res.status(201).json({
      status: "ok",
      saved: result.rows[0],
    });
  } catch (err) {
    console.error("Survey DB error:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});


// ================== HEALTH CHECK ==================
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ================== START SERVER ==================
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
