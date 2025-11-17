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

// ================== SINGLE API ROUTE ==================
app.post("/api/save", async (req, res) => {
  try {
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Missing type field" });
    }

    if (type === "event") {
      const {
        userId,
        sessionId,
        videoId,
        timestamp,
        src = null,
        watchedTime = null,
        duration = null,
        percent = null,
        extra = {},
        channelName = null,
        eventType,
      } = req.body;

      if (!userId || !sessionId || !videoId || !eventType || !timestamp) {
        return res.status(400).json({ error: "Missing required fields for event" });
      }

      await pool.query(
        `INSERT INTO video_events 
         (user_id, session_id, video_id, src, event_type, ts, extra, watched_time, duration, percent, channel_name)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [userId, sessionId, videoId, src, eventType, timestamp, extra, watchedTime, duration, percent, channelName]
      );

      return res.json({ status: "ok", saved: req.body });

    } else if (type === "survey") {
      const { userId, sessionId, answers, timestamp, screen_size, device_type } = req.body;

      if (!userId || !sessionId || !answers) {
        return res.status(400).json({ error: "Missing required fields for survey" });
      }

      const result = await pool.query(
        `INSERT INTO survey_responses 
         (user_id, session_id, answers, created_at, screen_size, device_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *;`,
        [userId, sessionId, answers, timestamp || new Date(), screen_size, device_type]
      );

      return res.status(201).json({ status: "ok", saved: result.rows[0] });
    } else {
      return res.status(400).json({ error: "Invalid type field" });
    }
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: "Database error", details: err.message });
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
